import { ConflictException, NotFoundException } from '@nestjs/common';
import { DiagnosticoStatus } from '@prisma/client';
import { selectDiagnosticoQuestionReferences } from '../useCases/diagnostico-reference-pool';
import { DiagnosticosRepository } from '../diagnosticos.repository';
import { DiagnosticosService } from '../diagnosticos.service';
import { EnemQuestionsService } from '../useCases/enem-questions.service';

const ALUNO_ID = '11111111-1111-4111-8111-111111111111';
const OUTRO_ALUNO_ID = '22222222-2222-4222-8222-222222222222';
const DIAGNOSTICO_ID = '33333333-3333-4333-8333-333333333333';

function diagnosticoRecord() {
  return {
    id: DIAGNOSTICO_ID,
    status: DiagnosticoStatus.EM_ANDAMENTO,
    criadoEm: new Date('2026-10-09T12:00:00.000Z'),
    finalizadoEm: null,
    _count: { questoes: 20 },
  };
}

describe('DiagnosticosService', () => {
  const createAlunoDiagnostico = jest.fn();
  const findAlunoDiagnosticoAtual = jest.fn();
  const findAlunoDiagnosticoHistory = jest.fn();
  const findAlunoDiagnosticoById = jest.fn();
  const findDiagnosticoQuestions = jest.fn();
  const findPendingDiagnosticoQuestions = jest.fn();
  const findAlunoDiagnosticoQuestionByResponseId = jest.fn();
  const registerAlunoDiagnosticoResponses = jest.fn();
  const updateAlunoDiagnosticoResponse = jest.fn();
  const finalizeAlunoDiagnostico = jest.fn();
  const findAlunoDiagnosticoResult = jest.fn();

  const repository = {
    createAlunoDiagnostico,
    findAlunoDiagnosticoAtual,
    findAlunoDiagnosticoHistory,
    findAlunoDiagnosticoById,
    findDiagnosticoQuestions,
    findPendingDiagnosticoQuestions,
    findAlunoDiagnosticoQuestionByResponseId,
    registerAlunoDiagnosticoResponses,
    updateAlunoDiagnosticoResponse,
    finalizeAlunoDiagnostico,
    findAlunoDiagnosticoResult,
  } as unknown as DiagnosticosRepository;

  const getPublicQuestion = jest.fn();
  const isAlternativeCorrect = jest.fn();
  const enemQuestionsService = {
    getPublicQuestion,
    isAlternativeCorrect,
  } as unknown as EnemQuestionsService;

  let service: DiagnosticosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DiagnosticosService(repository, enemQuestionsService);
  });

  it('cria diagnóstico para o aluno autenticado com 20 referências externas', async () => {
    createAlunoDiagnostico.mockResolvedValue({
      diagnostico: diagnosticoRecord(),
      created: true,
    });

    const result = await service.create(ALUNO_ID);

    expect(createAlunoDiagnostico).toHaveBeenCalledWith(
      ALUNO_ID,
      selectDiagnosticoQuestionReferences(),
    );
    expect(result.totalQuestoes).toBe(20);
  });

  it('impede segundo diagnóstico em andamento para o mesmo aluno', async () => {
    createAlunoDiagnostico.mockResolvedValue({
      diagnostico: diagnosticoRecord(),
      created: false,
    });

    await expect(service.create(ALUNO_ID)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('busca diagnóstico por id sempre restringindo ao aluno autenticado', async () => {
    findAlunoDiagnosticoById.mockResolvedValue(diagnosticoRecord());

    await service.findOne(ALUNO_ID, DIAGNOSTICO_ID);

    expect(findAlunoDiagnosticoById).toHaveBeenCalledWith(
      ALUNO_ID,
      DIAGNOSTICO_ID,
    );
    expect(findAlunoDiagnosticoById).not.toHaveBeenCalledWith(
      OUTRO_ALUNO_ID,
      DIAGNOSTICO_ID,
    );
  });

  it('registra respostas no escopo do aluno e retorna o progresso', async () => {
    const questao = {
      id: '44444444-4444-4444-8444-444444444444',
      questionYear: 2023,
      questionIndex: 1,
      language: 'default',
      ordem: 1,
      disciplinaId: null,
      conteudoId: null,
    };
    findAlunoDiagnosticoById.mockResolvedValue(diagnosticoRecord());
    findDiagnosticoQuestions.mockResolvedValue([questao]);
    isAlternativeCorrect.mockResolvedValue(true);
    registerAlunoDiagnosticoResponses.mockResolvedValue({
      kind: 'ok',
      status: DiagnosticoStatus.EM_ANDAMENTO,
      questoes: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          resposta: {
            id: '55555555-5555-4555-8555-555555555555',
            diagnosticoQuestaoId: '44444444-4444-4444-8444-444444444444',
            alternativaMarcada: 'A',
            acertoInformado: true,
            correcaoVerificada: false,
            respondidoEm: new Date('2026-10-10T03:00:00.000Z'),
            atualizadoEm: new Date('2026-10-10T03:00:00.000Z'),
          },
        },
        {
          id: '66666666-6666-4666-8666-666666666666',
          resposta: null,
        },
      ],
    });

    const result = await service.registerResponses(ALUNO_ID, DIAGNOSTICO_ID, {
      respostas: [
        {
          diagnosticoQuestaoId: '44444444-4444-4444-8444-444444444444',
          alternativaMarcada: ' a ',
        },
      ],
    });

    expect(registerAlunoDiagnosticoResponses).toHaveBeenCalledWith(
      ALUNO_ID,
      DIAGNOSTICO_ID,
      [
        {
          diagnosticoQuestaoId: '44444444-4444-4444-8444-444444444444',
          alternativaMarcada: 'A',
          acertoInformado: true,
        },
      ],
    );
    expect(result).toMatchObject({
      totalQuestoes: 2,
      respondidas: 1,
      restantes: 1,
      completo: false,
      proximaQuestaoId: '66666666-6666-4666-8666-666666666666',
    });
    expect(result).not.toHaveProperty('respostas');
  });

  it('carrega somente as questões ainda não respondidas', async () => {
    const questaoPendente = {
      id: '44444444-4444-4444-8444-444444444444',
      questionYear: 2023,
      questionIndex: 1,
      language: 'default',
      ordem: 1,
      disciplinaId: null,
      conteudoId: null,
    };
    const questaoPublica = {
      id: questaoPendente.id,
      year: 2023,
      index: 1,
      language: 'default',
      discipline: 'linguagens',
      title: 'Questão',
      context: null,
      question: 'Enunciado',
      alternatives: [{ letter: 'A', text: 'Alternativa' }],
    };
    findAlunoDiagnosticoById.mockResolvedValue(diagnosticoRecord());
    findPendingDiagnosticoQuestions.mockResolvedValue([questaoPendente]);
    getPublicQuestion.mockResolvedValue(questaoPublica);

    await expect(
      service.findQuestions(ALUNO_ID, DIAGNOSTICO_ID),
    ).resolves.toEqual([questaoPublica]);

    expect(findPendingDiagnosticoQuestions).toHaveBeenCalledWith(
      DIAGNOSTICO_ID,
    );
    expect(findDiagnosticoQuestions).not.toHaveBeenCalled();
  });

  it('rejeita a mesma questão repetida no mesmo POST', async () => {
    const questaoId = '44444444-4444-4444-8444-444444444444';

    await expect(
      service.registerResponses(ALUNO_ID, DIAGNOSTICO_ID, {
        respostas: [
          { diagnosticoQuestaoId: questaoId, alternativaMarcada: 'A' },
          { diagnosticoQuestaoId: questaoId, alternativaMarcada: 'B' },
        ],
      }),
    ).rejects.toThrow(
      'A mesma questão não pode aparecer mais de uma vez na solicitação.',
    );

    expect(registerAlunoDiagnosticoResponses).not.toHaveBeenCalled();
  });

  it('rejeita nova resposta quando a questão já foi respondida', async () => {
    registerAlunoDiagnosticoResponses.mockResolvedValue({ kind: 'duplicate' });

    await expect(
      service.registerResponses(ALUNO_ID, DIAGNOSTICO_ID, {
        respostas: [
          {
            diagnosticoQuestaoId: '44444444-4444-4444-8444-444444444444',
            alternativaMarcada: 'A',
          },
        ],
      }),
    ).rejects.toThrow(
      'Uma ou mais questões já possuem resposta registrada. Use PATCH para editar.',
    );
  });

  it('impede alterar resposta de diagnóstico encerrado', async () => {
    findAlunoDiagnosticoQuestionByResponseId.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      questionYear: 2023,
      questionIndex: 1,
      language: 'default',
      ordem: 1,
      disciplinaId: null,
      conteudoId: null,
    });
    isAlternativeCorrect.mockResolvedValue(false);
    updateAlunoDiagnosticoResponse.mockResolvedValue({ kind: 'closed' });

    await expect(
      service.updateResponse(
        ALUNO_ID,
        DIAGNOSTICO_ID,
        '55555555-5555-4555-8555-555555555555',
        { alternativaMarcada: 'B' },
      ),
    ).rejects.toThrow(
      'Respostas só podem ser alteradas enquanto o diagnóstico estiver em andamento.',
    );
  });

  it('finaliza e retorna resultado agregado sem duplicar desempenho', async () => {
    finalizeAlunoDiagnostico.mockResolvedValue({
      kind: 'already_finalized',
      finalizadoEm: new Date('2026-10-10T04:00:00.000Z'),
      totalQuestoes: 20,
      desempenhos: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          diagnosticoId: DIAGNOSTICO_ID,
          disciplinaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          conteudoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          tipoOrigem: 'DIAGNOSTICO',
          totalQuestoes: 5,
          acertos: 4,
          percentual: { toNumber: () => 80 },
          correcaoVerificada: false,
          registradoEm: new Date('2026-10-10T04:00:00.000Z'),
          disciplina: {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            nome: 'Matemática',
            codigo: 'matematica',
          },
          conteudo: {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            nome: 'Geral',
          },
        },
      ],
    });

    const result = await service.finalize(ALUNO_ID, DIAGNOSTICO_ID);

    expect(finalizeAlunoDiagnostico).toHaveBeenCalledWith(
      ALUNO_ID,
      DIAGNOSTICO_ID,
    );
    expect(result).toMatchObject({
      diagnosticoId: DIAGNOSTICO_ID,
      status: 'FINALIZADO',
      totalQuestoes: 20,
      totalAcertos: 4,
    });
  });

  it('impede finalizar diagnóstico incompleto', async () => {
    finalizeAlunoDiagnostico.mockResolvedValue({ kind: 'incomplete' });

    await expect(service.finalize(ALUNO_ID, DIAGNOSTICO_ID)).rejects.toThrow(
      'Todas as questões precisam estar respondidas e corrigidas antes da finalização.',
    );
  });

  it('impede consultar resultado antes da finalização', async () => {
    findAlunoDiagnosticoResult.mockResolvedValue({
      diagnostico: {
        id: DIAGNOSTICO_ID,
        status: DiagnosticoStatus.EM_ANDAMENTO,
        finalizadoEm: null,
        _count: { questoes: 20 },
      },
      desempenhos: [],
    });

    await expect(service.findResult(ALUNO_ID, DIAGNOSTICO_ID)).rejects.toThrow(
      'O diagnóstico ainda não foi finalizado.',
    );
  });

  it('não expõe questões quando o diagnóstico não pertence ao aluno', async () => {
    findAlunoDiagnosticoById.mockResolvedValue(null);

    await expect(
      service.findQuestions(OUTRO_ALUNO_ID, DIAGNOSTICO_ID),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(findAlunoDiagnosticoById).toHaveBeenCalledWith(
      OUTRO_ALUNO_ID,
      DIAGNOSTICO_ID,
    );
    expect(findPendingDiagnosticoQuestions).not.toHaveBeenCalled();
  });
});
