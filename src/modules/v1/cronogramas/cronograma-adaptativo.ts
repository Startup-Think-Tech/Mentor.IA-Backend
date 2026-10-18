import {
  CronogramaStatus,
  Prisma,
  RevisaoStatus,
  SessaoEstudoStatus,
} from '@prisma/client';
import { planejarSessoes, type GapPlanejamento } from './cronograma-engine';

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const DIAS_HISTORICO = 14;

/**
 * Reorganiza somente sessoes futuras pendentes do cronograma ATIVO.
 * Deve ser chamada DENTRO de uma transacao que ja detem o advisory lock
 * do aluno (o mesmo de CronogramasRepository.createSchedule).
 *
 * Nunca substitui o cronograma, apaga sessoes ou altera revisoes.
 * A capacidade de hoje e o historico ficam intocados.
 */
export async function recalcularSessoesFuturas(
  tx: Prisma.TransactionClient,
  alunoId: string,
  agora = new Date(),
) {
  const ativo = await tx.cronograma.findFirst({
    where: { alunoId, status: CronogramaStatus.ATIVO },
    select: { id: true, validoAte: true },
  });
  if (!ativo) {
    return { recalculado: false, motivo: 'sem_cronograma' as const };
  }

  const inicio = new Date(
    Date.UTC(
      agora.getUTCFullYear(),
      agora.getUTCMonth(),
      agora.getUTCDate() + 1,
      12,
    ),
  );
  const fim = ativo.validoAte;
  if (!fim) {
    return { recalculado: false, motivo: 'sem_fim' as const };
  }

  const dataFim = Date.UTC(
    fim.getUTCFullYear(),
    fim.getUTCMonth(),
    fim.getUTCDate(),
  );
  const dataInicio = Date.UTC(
    inicio.getUTCFullYear(),
    inicio.getUTCMonth(),
    inicio.getUTCDate(),
  );
  const dias = Math.round((dataFim - dataInicio) / UM_DIA_MS) + 1;

  if (dias <= 0) {
    return { recalculado: false, motivo: 'fora_do_periodo' as const };
  }

  const disponibilidades = await tx.disponibilidadeAluno.findMany({
    where: { alunoId },
    select: { diaSemana: true, minutosDisponiveis: true },
  });
  const historicoGaps = await tx.gap.findMany({
    where: { alunoId },
    orderBy: [{ calculadoEm: 'desc' }, { id: 'desc' }],
    select: {
      disciplinaId: true,
      conteudoId: true,
      desempenho: true,
      pontuacaoPrioridade: true,
    },
  });

  const historicoInicio = new Date(dataInicio - DIAS_HISTORICO * UM_DIA_MS);
  const execucoes = await tx.sessaoEstudo.findMany({
    where: {
      alunoId,
      status: {
        in: [SessaoEstudoStatus.CONCLUIDA, SessaoEstudoStatus.PERDIDA],
      },
      agendadoPara: { gte: historicoInicio, lt: inicio },
    },
    select: { disciplinaId: true, conteudoId: true, status: true },
  });

  const feedback = new Map<string, number>();
  for (const sessao of execucoes) {
    const chave = `${sessao.disciplinaId}:${sessao.conteudoId}`;
    const ajuste = sessao.status === SessaoEstudoStatus.PERDIDA ? 10 : -5;
    feedback.set(chave, (feedback.get(chave) ?? 0) + ajuste);
  }

  const chaves = new Set<string>();
  const gaps: GapPlanejamento[] = [];
  for (const gap of historicoGaps) {
    const chave = `${gap.disciplinaId}:${gap.conteudoId}`;
    if (chaves.has(chave)) continue;
    chaves.add(chave);
    const prioridadeBase = gap.pontuacaoPrioridade.toNumber();
    gaps.push({
      disciplinaId: gap.disciplinaId,
      conteudoId: gap.conteudoId,
      desempenho: gap.desempenho.toNumber(),
      // Historico afeta apenas a ordem do planejamento, nunca o gap salvo.
      pontuacaoPrioridade:
        prioridadeBase > 0
          ? Math.max(
              1,
              Math.min(100, prioridadeBase + (feedback.get(chave) ?? 0)),
            )
          : 0,
    });
  }

  const pendentes = await tx.revisao.findMany({
    where: {
      alunoId,
      cronogramaId: ativo.id,
      status: { in: [RevisaoStatus.PENDENTE, RevisaoStatus.ATRASADA] },
    },
    select: {
      id: true,
      disciplinaId: true,
      conteudoId: true,
      proximaRevisaoEm: true,
    },
  });

  const novas = planejarSessoes({
    dataInicio: inicio,
    dias,
    disponibilidades,
    gaps,
    revisoes: pendentes,
  });

  // Uma nova sessao pode ser criada somente apos cancelar as pendentes
  // do futuro; preservamos todas as linhas antigas como historico.
  const canceladas = await tx.sessaoEstudo.updateMany({
    where: {
      alunoId,
      cronogramaId: ativo.id,
      status: SessaoEstudoStatus.PENDENTE,
      agendadoPara: { gte: inicio },
    },
    data: { status: SessaoEstudoStatus.CANCELADA },
  });

  if (novas.length) {
    await tx.sessaoEstudo.createMany({
      data: novas.map((sessao) => ({
        cronogramaId: ativo.id,
        alunoId,
        disciplinaId: sessao.disciplinaId,
        conteudoId: sessao.conteudoId,
        revisaoId: sessao.revisaoOriginalId,
        tipo: sessao.tipo,
        status: SessaoEstudoStatus.PENDENTE,
        agendadoPara: sessao.agendadoPara,
        duracaoMinutos: sessao.duracaoMinutos,
      })),
    });
  }

  return {
    recalculado: true,
    cronogramaId: ativo.id,
    sessoesCanceladas: canceladas.count,
    sessoesCriadas: novas.length,
  };
}
