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
    { letter: 'A', text: 'Alternativa A', isCorrect: false },
    { letter: 'B', text: 'Alternativa B', isCorrect: true },
  ],
};

describe('EnemQuestionsService', () => {
  const service = new EnemQuestionsService();

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
        { letter: 'A', text: 'Alternativa A' },
        { letter: 'B', text: 'Alternativa B' },
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
});
