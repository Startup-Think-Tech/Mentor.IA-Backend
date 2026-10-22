import { Injectable } from '@nestjs/common';
import {
  CronogramaStatus,
  Prisma,
  RevisaoStatus,
  SessaoEstudoStatus,
  SessaoEstudoTipo,
} from '@prisma/client';
import { dataRevisaoUtc } from '../revisoes/useCases/revisao-intervalos';
import { recalcularSessoesFuturas } from '../cronogramas/useCases/cronograma-adaptativo';
import { PrismaService } from '../prisma/prisma.service';
import { ListarSessoesEstudoDto } from './dto/listar-sessoes-estudo.dto';

const sessaoSelect = {
  id: true,
  cronogramaId: true,
  tipo: true,
  status: true,
  agendadoPara: true,
  duracaoMinutos: true,
  concluidoEm: true,
  revisaoId: true,
  disciplina: {
    select: { id: true, nome: true, codigo: true },
  },
  conteudo: {
    select: { id: true, nome: true },
  },
} satisfies Prisma.SessaoEstudoSelect;

export type SessaoEstudoRecord = Prisma.SessaoEstudoGetPayload<{
  select: typeof sessaoSelect;
}>;

export type TransicaoSessaoResult =
  | { kind: 'ok'; sessao: SessaoEstudoRecord }
  | {
      kind:
        | 'not_found'
        | 'conflict'
        | 'future'
        | 'review_requires_result'
        | 'no_active_schedule';
    };

@Injectable()
export class SessoesEstudoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(alunoId: string, query: ListarSessoesEstudoDto) {
    return this.prisma.sessaoEstudo.findMany({
      where: {
        alunoId,
        ...(query.cronogramaId && { cronogramaId: query.cronogramaId }),
        ...(query.status && { status: query.status }),
        ...(query.tipo && { tipo: query.tipo }),
      },
      orderBy: [{ agendadoPara: 'desc' }, { id: 'desc' }],
      take: query.limite ?? 50,
      skip: query.offset ?? 0,
      select: sessaoSelect,
    });
  }

  hoje(alunoId: string, agora = new Date()) {
    const inicio = new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()),
    );
    const fim = new Date(inicio.getTime());
    fim.setUTCDate(fim.getUTCDate() + 1);
    return this.prisma.sessaoEstudo.findMany({
      where: {
        alunoId,
        agendadoPara: { gte: inicio, lt: fim },
      },
      orderBy: [{ agendadoPara: 'asc' }, { id: 'asc' }],
      select: sessaoSelect,
    });
  }

  buscar(alunoId: string, id: string) {
    return this.prisma.sessaoEstudo.findFirst({
      where: { alunoId, id },
      select: sessaoSelect,
    });
  }

  async alterarStatus(
    alunoId: string,
    id: string,
    novoStatus:
      typeof SessaoEstudoStatus.CONCLUIDA | typeof SessaoEstudoStatus.PERDIDA,
    agora = new Date(),
  ): Promise<TransicaoSessaoResult> {
    return this.prisma.$transaction(async (tx) => {
      // Mesmo lock do motor de cronogramas; evita colisao com recalculos.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${alunoId}, 0))
      `;

      const atual = await tx.sessaoEstudo.findFirst({
        where: { id, alunoId },
        select: {
          id: true,
          status: true,
          tipo: true,
          agendadoPara: true,
          disciplinaId: true,
          conteudoId: true,
        },
      });
      if (!atual) return { kind: 'not_found' };

      // Repetir uma transicao ja aplicada e seguro.
      if (atual.status === novoStatus) {
        const sessao = await tx.sessaoEstudo.findFirst({
          where: { id, alunoId },
          select: sessaoSelect,
        });
        return sessao ? { kind: 'ok', sessao } : { kind: 'not_found' };
      }

      if (atual.status !== SessaoEstudoStatus.PENDENTE) {
        return { kind: 'conflict' };
      }

      // O horario tecnico de referencia e 12h UTC; a regra opera por dia UTC.
      const diaAtual = Date.UTC(
        agora.getUTCFullYear(),
        agora.getUTCMonth(),
        agora.getUTCDate(),
      );
      const diaAgendado = Date.UTC(
        atual.agendadoPara.getUTCFullYear(),
        atual.agendadoPara.getUTCMonth(),
        atual.agendadoPara.getUTCDate(),
      );
      if (diaAgendado > diaAtual) return { kind: 'future' };

      // Revisoes exigem resultado de aprendizado, implementado em outro modulo.
      if (
        novoStatus === SessaoEstudoStatus.CONCLUIDA &&
        atual.tipo === SessaoEstudoTipo.REVISAO
      ) {
        return { kind: 'review_requires_result' };
      }

      // Conclusao de estudo inicia um ciclo de revisao em um dia, sem
      // duplicar revisoes que ja estao pendentes para o mesmo conteudo.
      const ativo =
        novoStatus === SessaoEstudoStatus.CONCLUIDA &&
        atual.tipo === SessaoEstudoTipo.ESTUDO
          ? await tx.cronograma.findFirst({
              where: { alunoId, status: CronogramaStatus.ATIVO },
              select: { id: true },
            })
          : null;
      if (
        novoStatus === SessaoEstudoStatus.CONCLUIDA &&
        atual.tipo === SessaoEstudoTipo.ESTUDO &&
        !ativo
      ) {
        return { kind: 'no_active_schedule' };
      }

      const alterado = await tx.sessaoEstudo.updateMany({
        where: { id, alunoId, status: SessaoEstudoStatus.PENDENTE },
        data: {
          status: novoStatus,
          concluidoEm:
            novoStatus === SessaoEstudoStatus.CONCLUIDA ? agora : null,
        },
      });

      if (alterado.count !== 1) {
        return { kind: 'conflict' };
      }

      if (ativo) {
        const pendente = await tx.revisao.findFirst({
          where: {
            alunoId,
            cronogramaId: ativo.id,
            disciplinaId: atual.disciplinaId,
            conteudoId: atual.conteudoId,
            status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
          },
          select: { id: true },
        });
        if (!pendente) {
          await tx.revisao.create({
            data: {
              cronogramaId: ativo.id,
              alunoId,
              disciplinaId: atual.disciplinaId,
              conteudoId: atual.conteudoId,
              intervaloAtual: 1,
              proximaRevisaoEm: dataRevisaoUtc(agora, 1),
              status: RevisaoStatus.PENDENTE,
            },
          });
        }
      }

      await recalcularSessoesFuturas(tx, alunoId, agora);
      const sessao = await tx.sessaoEstudo.findFirst({
        where: { id, alunoId },
        select: sessaoSelect,
      });
      return sessao ? { kind: 'ok', sessao } : { kind: 'not_found' };
    });
  }
}
