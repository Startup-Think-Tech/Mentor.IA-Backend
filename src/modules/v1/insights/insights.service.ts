import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { InsightJobStatus } from '@prisma/client';
import { CreateInsightDto } from './dto/create-insight.dto';
import { InsightJobRecord, InsightsRepository } from './insights.repository';

const jobStatuses: Record<InsightJobStatus, string> = {
  AGUARDANDO_RETENTATIVA: 'aguardando_retentativa',
  CONCLUIDO: 'concluido',
  FALHOU: 'falhou',
  PENDENTE: 'pendente',
  PROCESSANDO: 'processando',
};

@Injectable()
export class InsightsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly insightsRepository: InsightsRepository,
  ) {}

  async generate(
    alunoId: string,
    idempotencyKey: string | undefined,
    payload: CreateInsightDto,
  ) {
    const normalizedIdempotencyKey = idempotencyKey?.trim();
    if (!normalizedIdempotencyKey) {
      throw new BadRequestException('Idempotency-Key é obrigatório.');
    }

    const payloadHash = this.hashPayload(payload);

    let result: Awaited<ReturnType<InsightsRepository['createJobAndOutbox']>>;
    try {
      result = await this.insightsRepository.createJobAndOutbox({
        alunoId,
        idempotencyKey: normalizedIdempotencyKey,
        payloadHash,
        activeJobLimit: this.configService.getOrThrow<number>(
          'insightActiveJobLimit',
        ),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível registrar a solicitação de insight.',
      );
    }

    if (result.kind === 'limit') {
      throw new HttpException(
        'O limite de jobs de insight ativos foi atingido.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (result.kind === 'existing' && result.job.payloadHash !== payloadHash) {
      throw new ConflictException(
        'Idempotency-Key já foi usada com uma solicitação diferente.',
      );
    }

    return this.toGenerationResponse(result.job);
  }

  async findJob(alunoId: string, jobId: string) {
    const job = await this.insightsRepository.findAlunoJob(alunoId, jobId);
    if (!job) {
      throw new NotFoundException('Job de insight não encontrado.');
    }

    return this.toJobResponse(job);
  }

  async findAll(alunoId: string) {
    const insights = await this.insightsRepository.findAlunoInsights(alunoId);
    return insights
      .filter((insight) => !isProviderSafetyClassification(insight.conteudo))
      .map((insight) => this.toInsightResponse(insight));
  }

  async findOne(alunoId: string, insightId: string) {
    const insight = await this.insightsRepository.findAlunoInsight(
      alunoId,
      insightId,
    );
    if (!insight) {
      throw new NotFoundException('Insight não encontrado.');
    }

    return this.toInsightResponse(insight);
  }

  private toGenerationResponse(job: InsightJobRecord) {
    const prefix = this.configService
      .get<string>('apiPrefix', 'api/v1')
      .replace(/^\/+|\/+$/g, '');

    return {
      job_id: job.id,
      status: jobStatuses[job.status],
      status_url: `/${prefix}/insights/jobs/${job.id}`,
    };
  }

  private toJobResponse(job: InsightJobRecord) {
    return {
      job_id: job.id,
      status: jobStatuses[job.status],
      tentativas: job.tentativas,
      criado_em: job.criadoEm,
      atualizado_em: job.atualizadoEm,
      concluido_em: job.concluidoEm,
      insight_id: job.insight?.id ?? null,
      erro_resumo:
        job.status === InsightJobStatus.FALHOU ? job.erroResumo : null,
    };
  }

  private toInsightResponse(insight: {
    id: string;
    jobId: string;
    conteudo: string;
    criadoEm: Date;
    insightsDisciplinas: {
      disciplina: { id: string; nome: string; codigo: string };
    }[];
  }) {
    return {
      id: insight.id,
      job_id: insight.jobId,
      conteudo: insight.conteudo,
      criado_em: insight.criadoEm,
      disciplinas: insight.insightsDisciplinas.map(
        ({ disciplina }) => disciplina,
      ),
    };
  }

  private hashPayload(payload: CreateInsightDto) {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }
}

function isProviderSafetyClassification(content: string) {
  const normalized = content.trim().toLowerCase();
  return (
    normalized === 'user safety: safe' || normalized === 'user safety: unsafe'
  );
}
