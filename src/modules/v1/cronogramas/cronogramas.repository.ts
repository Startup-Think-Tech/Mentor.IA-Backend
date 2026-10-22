import { Injectable } from '@nestjs/common';
import {
  CronogramaStatus,
  Prisma,
  RevisaoStatus,
  SessaoEstudoStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  planejarSessoes,
  type GapPlanejamento,
} from './useCases/cronograma-engine';

const cronogramaSelect = {
  id: true,
  status: true,
  validoAPartir: true,
  validoAte: true,
  geradoEm: true,
  sessoesEstudo: {
    orderBy: [{ agendadoPara: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      tipo: true,
      status: true,
      agendadoPara: true,
      duracaoMinutos: true,
      revisaoId: true,
      disciplina: { select: { id: true, nome: true, codigo: true } },
      conteudo: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.CronogramaSelect;

export type CronogramaRecord = Prisma.CronogramaGetPayload<{
  select: typeof cronogramaSelect;
}>;

@Injectable()
export class CronogramasRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrent(alunoId: string) {
    return this.prisma.cronograma.findFirst({
      where: { alunoId, status: CronogramaStatus.ATIVO },
      select: cronogramaSelect,
    });
  }

  findHistory(alunoId: string) {
    return this.prisma.cronograma.findMany({
      where: { alunoId },
      orderBy: [{ geradoEm: 'desc' }, { id: 'asc' }],
      select: cronogramaSelect,
    });
  }

  findOne(alunoId: string, id: string) {
    return this.prisma.cronograma.findFirst({
      where: { alunoId, id },
      select: cronogramaSelect,
    });
  }

  async createSchedule(params: {
    alunoId: string;
    dataInicio: Date;
    dias: number;
    recalcular: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Serializa a geracao por aluno, inclusive duas solicitacoes simultaneas.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${params.alunoId}, 0))
      `;

      const aluno = await tx.aluno.findFirst({
        where: { id: params.alunoId, excluidoEm: null },
        select: { id: true },
      });
      if (!aluno) return { kind: 'not_found' as const };

      const ativo = await tx.cronograma.findFirst({
        where: { alunoId: params.alunoId, status: CronogramaStatus.ATIVO },
        select: { id: true },
      });
      if (ativo && !params.recalcular)
        return { kind: 'already_active' as const };
      if (!ativo && params.recalcular) return { kind: 'no_active' as const };

      const disponibilidades = await tx.disponibilidadeAluno.findMany({
        where: { alunoId: params.alunoId },
        select: { diaSemana: true, minutosDisponiveis: true },
      });
      if (!disponibilidades.some((dia) => dia.minutosDisponiveis >= 30)) {
        return { kind: 'no_availability' as const };
      }

      const historicoGaps = await tx.gap.findMany({
        where: { alunoId: params.alunoId },
        orderBy: [{ calculadoEm: 'desc' }, { id: 'desc' }],
        select: {
          disciplinaId: true,
          conteudoId: true,
          desempenho: true,
          pontuacaoPrioridade: true,
        },
      });
      const chaves = new Set<string>();
      const gaps: GapPlanejamento[] = [];
      for (const gap of historicoGaps) {
        const chave = `${gap.disciplinaId}:${gap.conteudoId}`;
        if (chaves.has(chave)) continue;
        chaves.add(chave);
        gaps.push({
          disciplinaId: gap.disciplinaId,
          conteudoId: gap.conteudoId,
          desempenho: gap.desempenho.toNumber(),
          pontuacaoPrioridade: gap.pontuacaoPrioridade.toNumber(),
        });
      }

      const revisoes = ativo
        ? await tx.revisao.findMany({
            where: {
              cronogramaId: ativo.id,
              alunoId: params.alunoId,
              status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
            },
            orderBy: [{ proximaRevisaoEm: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              disciplinaId: true,
              conteudoId: true,
              intervaloAtual: true,
              proximaRevisaoEm: true,
              status: true,
            },
          })
        : [];

      const sessoes = planejarSessoes({
        dataInicio: params.dataInicio,
        dias: params.dias,
        disponibilidades,
        gaps,
        revisoes,
      });
      if (!sessoes.length) return { kind: 'no_plan' as const };

      const ultimoDia = new Date(params.dataInicio.getTime());
      ultimoDia.setUTCDate(ultimoDia.getUTCDate() + params.dias - 1);

      // Preserva registros antigos. Apenas sessoes futuras e pendentes
      // sao canceladas; sessoes concluidas/perdidas permanecem historicas.
      if (ativo) {
        await tx.sessaoEstudo.updateMany({
          where: {
            cronogramaId: ativo.id,
            status: SessaoEstudoStatus.PENDENTE,
            agendadoPara: { gt: new Date() },
          },
          data: { status: SessaoEstudoStatus.CANCELADA },
        });
        await tx.revisao.updateMany({
          where: {
            cronogramaId: ativo.id,
            status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
          },
          data: { status: RevisaoStatus.CANCELADA },
        });
        await tx.cronograma.update({
          where: { id: ativo.id },
          data: { status: CronogramaStatus.SUBSTITUIDO, validoAte: new Date() },
        });
      }

      const novo = await tx.cronograma.create({
        data: {
          alunoId: params.alunoId,
          status: CronogramaStatus.ATIVO,
          validoAPartir: params.dataInicio,
          validoAte: ultimoDia,
        },
        select: { id: true },
      });

      // Clona revisoes ativas para vincular seus novos agendamentos ao plano
      // atual, preservando o historico da revisao anterior.
      const idsRevisoes = new Map(
        revisoes.map((revisao) => [revisao.id, randomUUID()]),
      );
      if (revisoes.length) {
        await tx.revisao.createMany({
          data: revisoes.map((revisao) => ({
            id: idsRevisoes.get(revisao.id)!,
            cronogramaId: novo.id,
            alunoId: params.alunoId,
            disciplinaId: revisao.disciplinaId,
            conteudoId: revisao.conteudoId,
            intervaloAtual: revisao.intervaloAtual,
            proximaRevisaoEm: revisao.proximaRevisaoEm,
            status: revisao.status,
          })),
        });
      }

      await tx.sessaoEstudo.createMany({
        data: sessoes.map((sessao) => ({
          cronogramaId: novo.id,
          alunoId: params.alunoId,
          disciplinaId: sessao.disciplinaId,
          conteudoId: sessao.conteudoId,
          tipo: sessao.tipo,
          status: SessaoEstudoStatus.PENDENTE,
          agendadoPara: sessao.agendadoPara,
          duracaoMinutos: sessao.duracaoMinutos,
          revisaoId: sessao.revisaoOriginalId
            ? idsRevisoes.get(sessao.revisaoOriginalId)!
            : null,
        })),
      });

      const cronograma = await tx.cronograma.findUniqueOrThrow({
        where: { id: novo.id },
        select: cronogramaSelect,
      });
      return { kind: 'ok' as const, cronograma };
    });
  }
}
