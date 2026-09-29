import { CronogramaStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type DisponibilidadeSemanal = {
  diaSemana: number;
  minutosDisponiveis: number;
};

@Injectable()
export class DisponibilidadeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveAlunoWeeklyAvailability(alunoId: string) {
    return this.prisma.disponibilidadeAluno.findMany({
      where: {
        alunoId,
        aluno: { excluidoEm: null },
      },
      orderBy: { diaSemana: 'asc' },
      select: {
        diaSemana: true,
        minutosDisponiveis: true,
      },
    });
  }

  async replaceActiveAlunoWeeklyAvailability(
    alunoId: string,
    disponibilidades: DisponibilidadeSemanal[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const aluno = await transaction.aluno.findFirst({
        where: { id: alunoId, excluidoEm: null },
        select: { id: true },
      });
      if (!aluno) {
        return null;
      }

      const atuais = await transaction.disponibilidadeAluno.findMany({
        where: { alunoId },
        orderBy: { diaSemana: 'asc' },
        select: {
          diaSemana: true,
          minutosDisponiveis: true,
        },
      });
      const mudou = !sameWeeklyAvailability(atuais, disponibilidades);

      if (mudou) {
        await transaction.disponibilidadeAluno.deleteMany({
          where: { alunoId },
        });
        await transaction.disponibilidadeAluno.createMany({
          data: disponibilidades.map((disponibilidade) => ({
            alunoId,
            ...disponibilidade,
          })),
        });
      }

      const cronogramaAtivo = mudou
        ? await transaction.cronograma.findFirst({
            where: { alunoId, status: CronogramaStatus.ATIVO },
            select: { id: true },
          })
        : null;

      return {
        disponibilidades,
        cronogramaPrecisaRecalculo: cronogramaAtivo !== null,
      };
    });
  }
}

function sameWeeklyAvailability(
  atuais: DisponibilidadeSemanal[],
  novas: DisponibilidadeSemanal[],
) {
  return (
    atuais.length === novas.length &&
    atuais.every(
      (atual, index) =>
        atual.diaSemana === novas[index]?.diaSemana &&
        atual.minutosDisponiveis === novas[index]?.minutosDisponiveis,
    )
  );
}
