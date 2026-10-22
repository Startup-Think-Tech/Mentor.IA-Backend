import { Injectable } from '@nestjs/common';
import {
  CronogramaStatus,
  Prisma,
  ResultadoRevisaoTipo,
  RevisaoStatus,
  SessaoEstudoStatus,
  SessaoEstudoTipo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { recalcularSessoesFuturas } from '../cronogramas/useCases/cronograma-adaptativo';
import {
  dataRevisaoUtc,
  inicioDiaUtc,
  proximoIntervalo,
} from './useCases/revisao-intervalos';

const revisaoSelect = {
  id: true,
  cronogramaId: true,
  disciplinaId: true,
  conteudoId: true,
  intervaloAtual: true,
  proximaRevisaoEm: true,
  status: true,
  criadoEm: true,
  atualizadoEm: true,
  disciplina: {
    select: { id: true, nome: true, codigo: true },
  },
  conteudo: {
    select: { id: true, nome: true },
  },
  resultados: {
    orderBy: [{ registradoEm: 'desc' }, { id: 'desc' }],
    select: { id: true, resultado: true, registradoEm: true },
  },
} satisfies Prisma.RevisaoSelect;

export type RevisaoRecord = Prisma.RevisaoGetPayload<{
  select: typeof revisaoSelect;
}>;

export type RegistrarResultadoResult =
  | {
      kind: 'ok';
      revisao: RevisaoRecord;
      proximaRevisao: RevisaoRecord;
      repetido: boolean;
    }
  | {
      kind: 'not_found' | 'conflict' | 'not_due' | 'future_session';
    };

@Injectable()
export class RevisoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(alunoId: string, cronogramaId: string) {
    return this.prisma.revisao.findMany({
      where: { alunoId, cronogramaId },
      orderBy: [{ proximaRevisaoEm: 'asc' }, { id: 'asc' }],
      select: revisaoSelect,
    });
  }

  pendentes(alunoId: string, cronogramaId: string) {
    return this.prisma.revisao.findMany({
      where: {
        alunoId,
        cronogramaId,
        status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
      },
      orderBy: [{ proximaRevisaoEm: 'asc' }, { id: 'asc' }],
      select: revisaoSelect,
    });
  }

  atrasadas(alunoId: string, cronogramaId: string, agora = new Date()) {
    return this.prisma.revisao.findMany({
      where: {
        alunoId,
        cronogramaId,
        status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
        proximaRevisaoEm: { lt: inicioDiaUtc(agora) },
      },
      orderBy: [{ proximaRevisaoEm: 'asc' }, { id: 'asc' }],
      select: revisaoSelect,
    });
  }

  historico(alunoId: string, cronogramaId: string) {
    return this.prisma.revisao.findMany({
      where: {
        alunoId,
        cronogramaId,
        status: { in: [RevisaoStatus.CONCLUIDA, RevisaoStatus.CANCELADA] },
      },
      orderBy: [{ atualizadoEm: 'desc' }, { id: 'asc' }],
      select: revisaoSelect,
    });
  }

  buscar(alunoId: string, cronogramaId: string, id: string) {
    return this.prisma.revisao.findFirst({
      where: { id, alunoId, cronogramaId },
      select: revisaoSelect,
    });
  }

  async registrarResultado(
    alunoId: string,
    cronogramaId: string,
    revisaoId: string,
    resultado: ResultadoRevisaoTipo,
    agora = new Date(),
  ): Promise<RegistrarResultadoResult> {
    return this.prisma.$transaction(async (tx) => {
      // Serializa com concluir sessão e recalcular cronograma.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${alunoId}, 0))
      `;

      const revisao = await tx.revisao.findFirst({
        where: { id: revisaoId, alunoId, cronogramaId },
        select: {
          id: true,
          alunoId: true,
          cronogramaId: true,
          disciplinaId: true,
          conteudoId: true,
          intervaloAtual: true,
          proximaRevisaoEm: true,
          status: true,
          cronograma: { select: { status: true } },
          resultados: {
            orderBy: { registradoEm: 'desc' },
            select: { resultado: true },
            take: 1,
          },
        },
      });
      if (!revisao) return { kind: 'not_found' };

      if (revisao.status === RevisaoStatus.CONCLUIDA) {
        if (revisao.resultados[0]?.resultado !== resultado) {
          return { kind: 'conflict' };
        }
        const original = await tx.revisao.findFirstOrThrow({
          where: { id: revisao.id, alunoId, cronogramaId },
          select: revisaoSelect,
        });
        const proxima = await tx.revisao.findFirst({
          where: {
            alunoId,
            cronogramaId,
            disciplinaId: revisao.disciplinaId,
            conteudoId: revisao.conteudoId,
            criadoEm: { gt: original.atualizadoEm },
          },
          orderBy: { criadoEm: 'asc' },
          select: revisaoSelect,
        });
        // Idempotencia: registro da mesma resposta nao gera outro ciclo.
        if (!proxima) return { kind: 'conflict' };
        return {
          kind: 'ok',
          revisao: original,
          proximaRevisao: proxima,
          repetido: true,
        };
      }

      if (
        !(
          revisao.status === RevisaoStatus.PENDENTE ||
          revisao.status === RevisaoStatus.ATRASADA
        ) ||
        revisao.cronograma.status !== CronogramaStatus.ATIVO
      ) {
        return { kind: 'conflict' };
      }

      const hoje = inicioDiaUtc(agora);
      if (inicioDiaUtc(revisao.proximaRevisaoEm).getTime() > hoje.getTime()) {
        return { kind: 'not_due' };
      }

      // Sessao associada a revisao so pode ser concluida no seu dia.
      const sessao = await tx.sessaoEstudo.findFirst({
        where: {
          revisaoId,
          alunoId,
          cronogramaId,
          tipo: SessaoEstudoTipo.REVISAO,
          status: SessaoEstudoStatus.PENDENTE,
        },
        select: { id: true, agendadoPara: true },
      });
      if (
        sessao &&
        inicioDiaUtc(sessao.agendadoPara).getTime() > hoje.getTime()
      ) {
        return { kind: 'future_session' };
      }

      const intervalo = proximoIntervalo(revisao.intervaloAtual, resultado);
      const vencimento = dataRevisaoUtc(agora, intervalo);

      await tx.resultadoRevisao.create({
        data: { revisaoId: revisao.id, resultado, registradoEm: agora },
      });
      await tx.revisao.update({
        where: { id: revisao.id },
        data: { status: RevisaoStatus.CONCLUIDA },
      });

      if (sessao) {
        await tx.sessaoEstudo.updateMany({
          where: {
            id: sessao.id,
            alunoId,
            status: SessaoEstudoStatus.PENDENTE,
          },
          data: { status: SessaoEstudoStatus.CONCLUIDA, concluidoEm: agora },
        });
      }

      const nova = await tx.revisao.create({
        data: {
          cronogramaId,
          alunoId,
          disciplinaId: revisao.disciplinaId,
          conteudoId: revisao.conteudoId,
          intervaloAtual: intervalo,
          proximaRevisaoEm: vencimento,
          status: RevisaoStatus.PENDENTE,
        },
        select: revisaoSelect,
      });
      await recalcularSessoesFuturas(tx, alunoId, agora);
      const finalizada = await tx.revisao.findFirstOrThrow({
        where: { id: revisao.id, alunoId, cronogramaId },
        select: revisaoSelect,
      });
      return {
        kind: 'ok',
        revisao: finalizada,
        proximaRevisao: nova,
        repetido: false,
      };
    });
  }
}
