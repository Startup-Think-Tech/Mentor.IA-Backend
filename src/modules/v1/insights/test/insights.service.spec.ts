jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsightJobStatus } from '@prisma/client';
import { InsightsRepository } from '../insights.repository';
import { InsightsService } from '../insights.service';

describe('InsightsService', () => {
  const alunoId = 'f0bb2801-bc8e-4bac-a135-954b5be1335d';
  const job = {
    criadoEm: new Date('2026-09-30T12:00:00.000Z'),
    atualizadoEm: new Date('2026-09-30T12:00:00.000Z'),
    concluidoEm: null,
    erroResumo: null,
    id: '7880624f-5c14-45c1-9493-5e2d2f4daa57',
    insight: null,
    payloadHash: 'payload-hash',
    status: InsightJobStatus.PENDENTE,
    tentativas: 0,
  };
  const configService = {
    get: jest.fn().mockReturnValue('api/v1'),
    getOrThrow: jest.fn().mockReturnValue(1),
  } as unknown as jest.Mocked<ConfigService>;
  const insightsRepository = {
    createJobAndOutbox: jest.fn(),
    findAlunoInsight: jest.fn(),
    findAlunoInsights: jest.fn(),
    findAlunoJob: jest.fn(),
  } as unknown as jest.Mocked<InsightsRepository>;
  const service = new InsightsService(configService, insightsRepository);

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get.mockReturnValue('api/v1');
    configService.getOrThrow.mockReturnValue(1);
  });

  it('returns the existing job for the same idempotent request', async () => {
    const payloadHash =
      '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a';
    insightsRepository.createJobAndOutbox.mockResolvedValue({
      kind: 'existing',
      job: { ...job, payloadHash },
    });

    await expect(service.generate(alunoId, 'request-1', {})).resolves.toEqual({
      job_id: job.id,
      status: 'pendente',
      status_url: `/api/v1/insights/jobs/${job.id}`,
    });
  });

  it('rejects a reused idempotency key with another payload', async () => {
    insightsRepository.createJobAndOutbox.mockResolvedValue({
      kind: 'existing',
      job,
    });

    await expect(service.generate(alunoId, 'request-1', {})).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns 429 when the aluno has reached the active job limit', async () => {
    insightsRepository.createJobAndOutbox.mockResolvedValue({ kind: 'limit' });

    await expect(
      service.generate(alunoId, 'request-1', {}),
    ).rejects.toMatchObject({
      status: 429,
    });
  });

  it('does not expose a job from another aluno', async () => {
    insightsRepository.findAlunoJob.mockResolvedValue(null);

    await expect(service.findJob(alunoId, job.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(insightsRepository.findAlunoJob.mock.calls).toEqual([
      [alunoId, job.id],
    ]);
  });

  it('does not return provider safety classifications as insights', async () => {
    insightsRepository.findAlunoInsights.mockResolvedValue([
      {
        id: 'invalid-insight',
        jobId: job.id,
        conteudo: 'User Safety: safe',
        criadoEm: new Date('2026-09-30T12:00:00.000Z'),
        insightsDisciplinas: [],
      },
    ]);

    await expect(service.findAll(alunoId)).resolves.toEqual([]);
  });
});
