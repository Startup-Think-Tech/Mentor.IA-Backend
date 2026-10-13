import { Injectable } from '@nestjs/common';
import { Prisma, TipoOrigemDesempenho } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const desempenhoSelect = {
  id: true,
  diagnosticoId: true,
  disciplinaId: true,
  conteudoId: true,
  tipoOrigem: true,
  totalQuestoes: true,
  acertos: true,
  percentual: true,
  correcaoVerificada: true,
  registradoEm: true,
  disciplina: {
    select: { id: true, nome: true, codigo: true },
  },
  conteudo: {
    select: { id: true, nome: true },
  },
} satisfies Prisma.RegistroDesempenhoSelect;

const diagnosticoParaDesempenhoSelect = {
  id: true,
  alunoId: true,
  status: true,
  questoes: {
    orderBy: { ordem: 'asc' as const },
    select: {
      disciplinaId: true,
      conteudoId: true,
      resposta: {
        select: {
          acertoInformado: true,
          correcaoVerificada: true,
        },
      },
    },
  },
} satisfies Prisma.DiagnosticoSelect;

export type DesempenhoRecord = Prisma.RegistroDesempenhoGetPayload<{
  select: typeof desempenhoSelect;
}>;

export type DiagnosticoParaDesempenho = Prisma.DiagnosticoGetPayload<{
  select: typeof diagnosticoParaDesempenhoSelect;
}>;

export type NovoDesempenhoDiagnostico = {
  disciplinaId: string;
  conteudoId: string;
  totalQuestoes: number;
  acertos: number;
  percentual: Prisma.Decimal;
  correcaoVerificada: boolean;
};

@Injectable()
export class DesempenhosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAlunoHistory(alunoId: string, diagnosticoId?: string) {
    return this.prisma.registroDesempenho.findMany({
      where: {
        alunoId,
        ...(diagnosticoId && { diagnosticoId }),
      },
      orderBy: { registradoEm: 'desc' },
      select: desempenhoSelect,
    });
  }

  findAlunoDisciplineHistory(
    alunoId: string,
    disciplinaId: string,
    diagnosticoId?: string,
  ) {
    return this.prisma.registroDesempenho.findMany({
      where: {
        alunoId,
        disciplinaId,
        ...(diagnosticoId && { diagnosticoId }),
      },
      orderBy: { registradoEm: 'desc' },
      select: desempenhoSelect,
    });
  }

  findAlunoDiagnosticoForPerformance(alunoId: string, diagnosticoId: string) {
    return this.prisma.diagnostico.findFirst({
      where: { id: diagnosticoId, alunoId },
      select: diagnosticoParaDesempenhoSelect,
    });
  }

  async persistDiagnosticPerformanceIdempotently(
    alunoId: string,
    diagnosticoId: string,
    registros: NovoDesempenhoDiagnostico[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${diagnosticoId}, 0))
      `;

      const existing = await transaction.registroDesempenho.findMany({
        where: {
          alunoId,
          diagnosticoId,
          tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
        },
        orderBy: { registradoEm: 'desc' },
        select: desempenhoSelect,
      });

      if (existing.length > 0) {
        return existing;
      }

      await transaction.registroDesempenho.createMany({
        data: registros.map((registro) => ({
          alunoId,
          diagnosticoId,
          tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
          ...registro,
        })),
      });

      return transaction.registroDesempenho.findMany({
        where: {
          alunoId,
          diagnosticoId,
          tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
        },
        orderBy: { registradoEm: 'desc' },
        select: desempenhoSelect,
      });
    });
  }
}
