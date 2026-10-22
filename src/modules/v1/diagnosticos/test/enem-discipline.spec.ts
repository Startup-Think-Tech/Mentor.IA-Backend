import {
  ENEM_DISCIPLINE_SUBJECTS,
  getEnemDisciplineByQuestionIndex,
} from '../useCases/enem-discipline';

describe('ENEM discipline mapping', () => {
  it.each([
    [1, 'linguagens'],
    [45, 'linguagens'],
    [46, 'ciencias-humanas'],
    [90, 'ciencias-humanas'],
    [91, 'ciencias-natureza'],
    [135, 'ciencias-natureza'],
    [136, 'matematica'],
    [180, 'matematica'],
  ] as const)('maps question %i to %s', (index, discipline) => {
    expect(getEnemDisciplineByQuestionIndex(index)).toBe(discipline);
  });

  it('keeps the school subjects grouped by official ENEM area', () => {
    expect(ENEM_DISCIPLINE_SUBJECTS.linguagens).toContain('Português');
    expect(ENEM_DISCIPLINE_SUBJECTS['ciencias-natureza']).toEqual(
      expect.arrayContaining(['Biologia', 'Física', 'Química']),
    );
    expect(ENEM_DISCIPLINE_SUBJECTS['ciencias-humanas']).toEqual(
      expect.arrayContaining([
        'História',
        'Geografia',
        'Filosofia',
        'Sociologia',
      ]),
    );
    expect(ENEM_DISCIPLINE_SUBJECTS.matematica).toEqual(['Matemática']);
  });
});
