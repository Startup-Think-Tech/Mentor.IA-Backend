import { EnemQuestionsService } from '../useCases/enem-questions.service';

const reference = {
  id: '11111111-1111-4111-8111-111111111111',
  questionYear: 2023,
  questionIndex: 1,
  language: 'default',
  ordem: 1,
  disciplinaId: null,
  conteudoId: null,
};

const enemQuestion = {
  title: 'Questão de exemplo',
  year: 2023,
  index: 1,
  context: null,
  alternativesIntroduction: 'Qual é a alternativa correta?',
  correctAlternative: 'B',
  alternatives: [
    { letter: 'A', text: 'Alternativa A', file: null, isCorrect: false },
    { letter: 'B', text: 'Alternativa B', file: null, isCorrect: true },
  ],
};

describe('EnemQuestionsService', () => {
  let service: EnemQuestionsService;

  beforeEach(() => {
    service = new EnemQuestionsService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('remove o gabarito ao preparar uma questão para o frontend', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(enemQuestion),
    } as Response);

    const question = await service.getPublicQuestion(reference);

    expect(question).toEqual({
      id: reference.id,
      year: 2023,
      index: 1,
      language: 'default',
      discipline: 'linguagens',
      title: 'Questão de exemplo',
      context: null,
      question: 'Qual é a alternativa correta?',
      alternatives: [
        { letter: 'A', text: 'Alternativa A', imageUrl: null },
        { letter: 'B', text: 'Alternativa B', imageUrl: null },
      ],
    });
    expect(JSON.stringify(question)).not.toContain('correctAlternative');
    expect(JSON.stringify(question)).not.toContain('isCorrect');
  });

  it('confere a alternativa sem enviar o gabarito ao cliente', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(enemQuestion),
    } as Response);

    await expect(service.isAlternativeCorrect(reference, 'B')).resolves.toBe(
      true,
    );
    await expect(service.isAlternativeCorrect(reference, 'A')).resolves.toBe(
      false,
    );
  });

  it('reutiliza a questão carregada ao conferir a resposta', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(enemQuestion),
    } as Response);

    await service.getPublicQuestion(reference);
    await service.isAlternativeCorrect(reference, 'B');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('repete uma falha temporária ao consultar a fonte do ENEM', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(enemQuestion),
      } as Response);

    await expect(service.getPublicQuestion(reference)).resolves.toMatchObject({
      id: reference.id,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('preserva uma alternativa visual hospedada pelo ENEM', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...enemQuestion,
          alternatives: [
            {
              letter: 'A',
              text: null,
              file: 'https://enem.dev/2023/questions/1/alternative-a.png',
              isCorrect: false,
            },
          ],
        }),
    } as Response);

    await expect(service.getPublicQuestion(reference)).resolves.toMatchObject({
      alternatives: [
        {
          letter: 'A',
          text: null,
          imageUrl: 'https://enem.dev/2023/questions/1/alternative-a.png',
        },
      ],
    });
  });

  it('remove uma imagem de alternativa de origem não confiável', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...enemQuestion,
          alternatives: [
            {
              letter: 'A',
              text: null,
              file: 'https://example.com/alternative-a.png',
              isCorrect: false,
            },
          ],
        }),
    } as Response);

    await expect(service.getPublicQuestion(reference)).resolves.toMatchObject({
      alternatives: [{ letter: 'A', text: null, imageUrl: null }],
    });
  });

  it('mantém alternativas sem conteúdo quando a fonte do ENEM estiver incompleta', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...enemQuestion,
          alternatives: [
            { letter: 'A', text: null, file: null, isCorrect: false },
            { letter: 'B', text: null, file: null, isCorrect: false },
          ],
        }),
    } as Response);

    await expect(service.getPublicQuestion(reference)).resolves.toMatchObject({
      alternatives: [
        { letter: 'A', text: null, imageUrl: null },
        { letter: 'B', text: null, imageUrl: null },
      ],
    });
  });

  it('substitui a questão 132 incompleta por uma questão válida da mesma área', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...enemQuestion, index: 131 }),
    } as Response);

    await service.getPublicQuestion({ ...reference, questionIndex: 132 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.enem.dev/v1/exams/2023/questions/131',
      expect.anything(),
    );
  });

  it('substitui a questão 141 sem contexto por uma questão completa', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...enemQuestion, index: 143 }),
    } as Response);

    await service.getPublicQuestion({ ...reference, questionIndex: 141 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.enem.dev/v1/exams/2023/questions/143',
      expect.anything(),
    );
  });
});
