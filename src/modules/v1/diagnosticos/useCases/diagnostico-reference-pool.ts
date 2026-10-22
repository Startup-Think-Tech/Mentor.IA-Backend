export type DiagnosticoQuestionReference = {
  questionYear: number;
  questionIndex: number;
  language: string;
};

const ENEM_2023_DIAGNOSTICO_INDEXES = [
  6, 15, 24, 33, 42, 51, 60, 69, 78, 87, 96, 105, 114, 123, 131, 143, 150, 159,
  168, 177,
] as const;

export function selectDiagnosticoQuestionReferences(): DiagnosticoQuestionReference[] {
  return ENEM_2023_DIAGNOSTICO_INDEXES.map((questionIndex) => ({
    questionYear: 2023,
    questionIndex,
    language: 'default',
  }));
}
