import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsightJobStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';

@Injectable()
export class InsightProcessingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InsightProcessingService.name);
  private timer?: ReturnType<typeof setInterval>;
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit: RabbitMqService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.config.get<string>('INSIGHT_PROCESSING_ENABLED') !== 'true') {
      this.logger.log(
        'Insight processing disabled; set INSIGHT_PROCESSING_ENABLED=true',
      );
      return;
    }
    this.timer = setInterval(() => void this.runOnce(), 5000);
    this.timer.unref();
    void this.runOnce();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce() {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.recoverOutboxLocks();
      await this.dispatch();
    } catch (error) {
      this.logger.error(
        'Insight dispatch failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.processing = false;
    }
  }

  private async recoverOutboxLocks() {
    await this.prisma.outboxEvento.updateMany({
      where: { status: 'publishing', lockExpiraEm: { lt: new Date() } },
      data: { status: 'retry', processingToken: null, lockExpiraEm: null },
    });
  }

  private async dispatch() {
    const agora = new Date();
    const candidates = await this.prisma.outboxEvento.findMany({
      where: {
        status: { in: ['pending', 'retry'] },
        proximaTentativaEm: { lte: agora },
      },
      orderBy: { criadoEm: 'asc' },
      take: 10,
    });

    for (const event of candidates) {
      const token = randomUUID();
      const claimed = await this.prisma.outboxEvento.updateMany({
        where: {
          id: event.id,
          status: { in: ['pending', 'retry'] },
          proximaTentativaEm: { lte: agora },
        },
        data: {
          status: 'publishing',
          processingToken: token,
          lockExpiraEm: new Date(Date.now() + 60_000),
          tentativas: { increment: 1 },
        },
      });
      if (claimed.count !== 1) continue;
      try {
        await this.rabbit.publish(event.tipo, event.payload);
        await this.prisma.outboxEvento.updateMany({
          where: { id: event.id, processingToken: token },
          data: {
            status: 'published',
            publicadoEm: new Date(),
            processingToken: null,
            lockExpiraEm: null,
            erroResumo: null,
          },
        });
      } catch (error) {
        const retries = event.tentativas + 1;
        await this.prisma.outboxEvento.updateMany({
          where: { id: event.id, processingToken: token },
          data: {
            status: retries >= 5 ? 'failed' : 'retry',
            processingToken: null,
            lockExpiraEm: null,
            proximaTentativaEm: new Date(
              Date.now() + Math.min(60_000, 2 ** retries * 1000),
            ),
            erroResumo:
              error instanceof Error
                ? error.message.slice(0, 300)
                : 'Erro ao publicar',
          },
        });
      }
    }
  }

  /**
   * Consumer uses an idempotent DB claim: only one process can move PENDENTE
   * to PROCESSANDO. A duplicate delivery sees a terminal/active state.
   */
  async process(jobId: string, alunoId: string) {
    const token = randomUUID();
    const claimed = await this.prisma.insightJob.updateMany({
      where: { id: jobId, alunoId, status: InsightJobStatus.PENDENTE },
      data: {
        status: InsightJobStatus.PROCESSANDO,
        processingToken: token,
        leaseExpiraEm: new Date(Date.now() + 120_000),
        tentativas: { increment: 1 },
      },
    });
    if (claimed.count !== 1) return;

    try {
      const dados = await this.prisma.gap.findMany({
        where: { alunoId },
        orderBy: [{ calculadoEm: 'desc' }, { id: 'desc' }],
        select: {
          disciplinaId: true,
          pontuacaoPrioridade: true,
          disciplina: { select: { nome: true } },
        },
      });
      const latest = new Map<string, (typeof dados)[number]>();
      for (const gap of dados)
        if (!latest.has(gap.disciplinaId)) latest.set(gap.disciplinaId, gap);
      const contexto = [...latest.values()]
        .sort(
          (a, b) =>
            b.pontuacaoPrioridade.toNumber() - a.pontuacaoPrioridade.toNumber(),
        )
        .slice(0, 5)
        .map(
          (g) =>
            `${g.disciplina.nome}: prioridade ${g.pontuacaoPrioridade.toNumber()}/100`,
        )
        .join('; ');

      const apiUrl = this.config.get<string>('INSIGHT_AI_URL');
      const apiKey = this.config.get<string>('INSIGHT_AI_API_KEY');
      const model = this.config.get<string>('INSIGHT_AI_MODEL');
      if (!apiUrl || !apiKey || !model)
        throw new Error('Provedor de IA não configurado');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Você é um orientador de estudos ENEM. Gere um insight curto, prático e fundamentado exclusivamente nos dados fornecidos. Não invente notas ou fatos.',
            },
            {
              role: 'user',
              content:
                contexto ||
                'Nenhum gap acadêmico registrado ainda. Oriente o aluno a concluir o diagnóstico primeiro.',
            },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`IA HTTP ${response.status}`);
      const json: unknown = await response.json();
      const texto = this.parseContent(json);
      if (!texto) throw new Error('Resposta de IA sem conteúdo');
      await this.prisma.$transaction(async (tx) => {
        const status = await tx.insightJob.updateMany({
          where: {
            id: jobId,
            alunoId,
            processingToken: token,
            status: InsightJobStatus.PROCESSANDO,
          },
          data: {
            status: InsightJobStatus.CONCLUIDO,
            concluidoEm: new Date(),
            processingToken: null,
            leaseExpiraEm: null,
            erroCodigo: null,
            erroResumo: null,
          },
        });
        if (!status.count) return;
        await tx.insight.create({
          data: {
            alunoId,
            jobId,
            conteudo: texto,
            insightsDisciplinas: {
              create: [...latest.keys()]
                .slice(0, 5)
                .map((disciplinaId) => ({ disciplinaId })),
            },
          },
        });
      });
    } catch (error) {
      this.logger.warn(`Insight job processing failed: ${jobId}`);
      await this.prisma.insightJob.updateMany({
        where: { id: jobId, processingToken: token },
        data: {
          status: InsightJobStatus.FALHOU,
          processingToken: null,
          leaseExpiraEm: null,
          erroCodigo: 'PROCESSING_FAILED',
          erroResumo:
            error instanceof Error
              ? error.message.slice(0, 300)
              : 'Falha de processamento',
        },
      });
    }
  }

  private parseContent(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || !('choices' in value))
      return null;
    const choices = (value as { choices?: unknown }).choices;
    if (!Array.isArray(choices)) return null;
    const first: unknown = choices[0];
    if (typeof first !== 'object' || first === null || !('message' in first))
      return null;
    const message: unknown = first.message;
    if (
      typeof message !== 'object' ||
      message === null ||
      !('content' in message)
    )
      return null;
    const text: unknown = message.content;
    return typeof text === 'string' && text.trim() ? text.slice(0, 5000) : null;
  }
}
