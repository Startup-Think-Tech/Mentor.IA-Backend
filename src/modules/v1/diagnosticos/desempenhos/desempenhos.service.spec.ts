import { ConflictException } from '@nestjs/common';
import {
  DiagnosticoStatus,
  Prisma,
  TipoOrigemDesempenho,
} from '@prisma/client';
import type {
  DesempenhoRecord,
  DiagnosticoParaDesempenho,
} from './desempenhos.repository';
import { DesempenhosRepository } from './desempenhos.repository';
import { DesempenhosService } from './desempenhos.service';

const ALUNO_ID = '11111111-1111-4111-8111-111111111111';
const DIAGNOSTICO_ID = '22222222-2222-4222-8222-222222222222';
const DISCIPLINA_ID = '33333333-3333-4333-8333-333333333333';
const CONTEUDO_ID = '44444444-4444-4444-8444-444444444444';
const OUTRO_CONTEUDO_ID = '55555555-5555-4555-8555-555555555555';

function desempenhoRecord(
  id: string,
  conteudoId = CONTEUDO_ID,
  registradoEm = new Date('2026-10-09T12:00:00.000Z'),
): DesempenhoRecord {
  return {
    id,
    diagnosticoId: DIAGNOSTICO_ID,
    disciplinaId: DISCIPLINA_ID,
    conteudoId,
    tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
    totalQuestoes: 2,
    acertos: 1,
    percentual: new Prisma.Decimal(50),
    correcaoVerificada: false,
    registradoEm,
    disciplina: {
      id: DISCIPLINA_ID,
      nome: 'Matemática',
      codigo: 'matematica',
    },
    conteudo: {
      id: conteudoId,
      nome: 'Funções',
    },
  };
}

function diagnosticoFinalizado(): DiagnosticoParaDesempenho {
  return {
    id: DIAGNOSTICO_ID,
    alunoId: ALUNO_ID,
    status: DiagnosticoStatus.FINALIZADO,
    questoes: [
      {
        disciplinaId: DISCIPLINA_ID,
        conteudoId: CONTEUDO_ID,
        resposta: { acertoInformado: true, correcaoVerificada: true },
      },
      {
        disciplinaId: DISCIPLINA_ID,
        conteudoId: CONTEUDO_ID,
        resposta: { acertoInformado: false, correcaoVerificada: false },
      },
      {
        disciplinaId: DISCIPLINA_ID,
        conteudoId: OUTRO_CONTEUDO_ID,
        resposta: { acertoInformado: true, correcaoVerificada: true },
      },
    ],
  };
}

describe('DesempenhosService', () => {
  const findAlunoHistory = jest.fn();
  const findAlunoDisciplineHistory = jest.fn();
  const findAlunoDiagnosticoForPerformance = jest.fn();
  const persistDiagnosticPerformanceIdempotently = jest.fn();

  const repository = {
    findAlunoHistory,
    findAlunoDisciplineHistory,
    findAlunoDiagnosticoForPerformance,
    persistDiagnosticPerformanceIdempotently,
  } as unknown as DesempenhosRepository;

  let service: DesempenhosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DesempenhosService(repository);
  });

  it('retorna somente o registro mais recente por disciplina e conteúdo', async () => {
    const recente = desempenhoRecord(
      '66666666-6666-4666-8666-666666666666',
      CONTEUDO_ID,
      new Date('2026-10-10T12:00:00.000Z'),
    );
    const antigo = desempenhoRecord(
      '77777777-7777-4777-8777-777777777777',
      CONTEUDO_ID,
      new Date('2026-10-09T12:00:00.000Z'),
    );
    const outroConteudo = desempenhoRecord(
      '88888888-8888-4888-8888-888888888888',
      OUTRO_CONTEUDO_ID,
    );
    findAlunoHistory.mockResolvedValue([recente, antigo, outroConteudo]);

    const result = await service.findCurrent(ALUNO_ID, DIAGNOSTICO_ID);

    expect(findAlunoHistory).toHaveBeenCalledWith(ALUNO_ID, DIAGNOSTICO_ID);
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual([
      recente.id,
      outroConteudo.id,
    ]);
  });

  it('consulta disciplina sempre no escopo do aluno autenticado', async () => {
    findAlunoDisciplineHistory.mockResolvedValue([]);

    await service.findByDiscipline(ALUNO_ID, DISCIPLINA_ID, DIAGNOSTICO_ID);

    expect(findAlunoDisciplineHistory).toHaveBeenCalledWith(
      ALUNO_ID,
      DISCIPLINA_ID,
      DIAGNOSTICO_ID,
    );
  });

  it('consolida desempenho por disciplina e conteúdo com percentual e verificação corretos', async () => {
    findAlunoDiagnosticoForPerformance.mockResolvedValue(
      diagnosticoFinalizado(),
    );
    const persisted = [
      desempenhoRecord('99999999-9999-4999-8999-999999999999'),
      desempenhoRecord(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        OUTRO_CONTEUDO_ID,
      ),
    ];
    persistDiagnosticPerformanceIdempotently.mockResolvedValue(persisted);

    await service.consolidateDiagnosticPerformance(ALUNO_ID, DIAGNOSTICO_ID);

    expect(persistDiagnosticPerformanceIdempotently).toHaveBeenCalledWith(
      ALUNO_ID,
      DIAGNOSTICO_ID,
      [
        expect.objectContaining({
          disciplinaId: DISCIPLINA_ID,
          conteudoId: CONTEUDO_ID,
          totalQuestoes: 2,
          acertos: 1,
          correcaoVerificada: false,
          percentual: new Prisma.Decimal('50.00'),
        }),
        expect.objectContaining({
          disciplinaId: DISCIPLINA_ID,
          conteudoId: OUTRO_CONTEUDO_ID,
          totalQuestoes: 1,
          acertos: 1,
          correcaoVerificada: true,
          percentual: new Prisma.Decimal('100.00'),
        }),
      ],
    );
  });

  it('recusa consolidar diagnóstico ainda em andamento', async () => {
    const diagnostico = diagnosticoFinalizado();
    diagnostico.status = DiagnosticoStatus.EM_ANDAMENTO;
    findAlunoDiagnosticoForPerformance.mockResolvedValue(diagnostico);

    await expect(
      service.consolidateDiagnosticPerformance(ALUNO_ID, DIAGNOSTICO_ID),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(persistDiagnosticPerformanceIdempotently).not.toHaveBeenCalled();
  });

  it('recusa consolidar questão sem disciplina ou conteúdo', async () => {
    const diagnostico = diagnosticoFinalizado();
    diagnostico.questoes[0].conteudoId = null;
    findAlunoDiagnosticoForPerformance.mockResolvedValue(diagnostico);

    await expect(
      service.consolidateDiagnosticPerformance(ALUNO_ID, DIAGNOSTICO_ID),
    ).rejects.toThrow(
      'As questões do diagnóstico precisam de disciplina e conteúdo para consolidar desempenho.',
    );
  });
});
