export type EnemDiscipline =
  'linguagens' | 'ciencias-humanas' | 'ciencias-natureza' | 'matematica';

export function getEnemDisciplineByQuestionIndex(
  questionIndex: number,
): EnemDiscipline {
  if (questionIndex >= 1 && questionIndex <= 45) {
    return 'linguagens';
  }

  if (questionIndex >= 46 && questionIndex <= 90) {
    return 'ciencias-humanas';
  }

  if (questionIndex >= 91 && questionIndex <= 135) {
    return 'ciencias-natureza';
  }

  if (questionIndex >= 136 && questionIndex <= 180) {
    return 'matematica';
  }

  throw new RangeError('Índice de questão ENEM fora do intervalo 1-180.');
}

export const ENEM_DISCIPLINE_SUBJECTS: Record<EnemDiscipline, string[]> = {
  linguagens: [
    'Português',
    'Literatura',
    'Inglês',
    'Espanhol',
    'Artes',
    'Educação Física',
    'Tecnologias da Informação e Comunicação',
  ],
  'ciencias-humanas': ['História', 'Geografia', 'Filosofia', 'Sociologia'],
  'ciencias-natureza': ['Biologia', 'Física', 'Química'],
  matematica: ['Matemática'],
};

export const ENEM_DISCIPLINE_METADATA: Record<
  EnemDiscipline,
  { nome: string; codigo: string }
> = {
  linguagens: { nome: 'Linguagens', codigo: 'linguagens' },
  'ciencias-humanas': {
    nome: 'Ciências Humanas',
    codigo: 'ciencias-humanas',
  },
  'ciencias-natureza': {
    nome: 'Ciências da Natureza',
    codigo: 'ciencias-natureza',
  },
  matematica: { nome: 'Matemática', codigo: 'matematica' },
};
