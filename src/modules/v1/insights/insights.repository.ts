import { Injectable } from '@nestjs/common';
import { InsightJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const insightJobSelect = {
  id: true,
  status: true,
  payloadHash: true,
  tentativas: true,
  criadoEm: true,
  atualizadoEm: true,
  concluidoEm: true,
  erroResumo: true,
  insight: {
    select: { id: true },
  },
} satisfies Prisma.InsightJobSelect;

export type InsightJobRecord = Prisma.InsightJobGetPayload<{
  select: typeof insightJobSelect;
}>;

type CreateInsightJobResult =
  | { kind: 'created'; job: InsightJobRecord }
  | { kind: 'existing'; job: InsightJobRecord }
  | { kind: 'limit' };

@Injectable()
export class InsightsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJobAndOutbox(params: {
    alunoId: string;
    idempotencyKey: string;
    payloadHash: string;
    activeJobLimit: number;
  }): Promise<CreateInsightJobResult> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const existing = await transaction.insightJob.findUnique({
              where: {
                alunoId_idempotencyKey: {
                  alunoId: params.alunoId,
                  idempotencyKey: params.idempotencyKey,
                },
              },
              select: insightJobSelect,
            });
            if (existing) {
              return { kind: 'existing', job: existing };
            }

            const activeJobs = await transaction.insightJob.count({
              where: {
                alunoId: params.alunoId,
                status: {
                  in: [
                    InsightJobStatus.PENDENTE,
                    InsightJobStatus.PROCESSANDO,
                    InsightJobStatus.AGUARDANDO_RETENTATIVA,
                  ],
                },
              },
            });
            if (activeJobs >= params.activeJobLimit) {
              return { kind: 'limit' };
            }

            const job = await transaction.insightJob.create({
              data: {
                alunoId: params.alunoId,
                idempotencyKey: params.idempotencyKey,
                payloadHash: params.payloadHash,
              },
              select: insightJobSelect,
            });
            await transaction.outboxEvento.create({
              data: {
                jobId: job.id,
                tipo: 'insight.requested',
                payload: {
                  job_id: job.id,
                  aluno_id: params.alunoId,
                },
              },
            });

            return { kind: 'created', job };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (!this.isTransactionConflict(error) || attempt === 2) {
          throw error;
        }
      }
    }

    throw new Error('Não foi possível criar o job de insight.');
  }

  findAlunoJob(alunoId: string, jobId: string) {
    return this.prisma.insightJob.findFirst({
      where: { alunoId, id: jobId },
      select: insightJobSelect,
    });
  }

  findAlunoInsights(alunoId: string) {
    return this.prisma.insight.findMany({
      where: { alunoId },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        jobId: true,
        conteudo: true,
        criadoEm: true,
        insightsDisciplinas: {
          select: {
            disciplina: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
          },
        },
      },
    });
  }

  findAlunoInsight(alunoId: string, insightId: string) {
    return this.prisma.insight.findFirst({
      where: { alunoId, id: insightId },
      select: {
        id: true,
        jobId: true,
        conteudo: true,
        criadoEm: true,
        insightsDisciplinas: {
          select: {
            disciplina: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
          },
        },
      },
    });
  }

  private isTransactionConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
}
