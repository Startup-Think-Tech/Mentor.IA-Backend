import { BadGatewayException, Injectable } from '@nestjs/common';
import type { DiagnosticoQuestaoRecord } from '../diagnosticos.repository';
import { getEnemDisciplineByQuestionIndex } from './enem-discipline';

const sourceQuestionFallbacks: Record<string, { year: number; index: number }> =
  {
    '2023:132': { year: 2023, index: 131 },
    '2023:141': { year: 2023, index: 143 },
  };

type EnemAlternative = {
  letter: string;
  text: string | null;
  file: string | null;
};

type EnemQuestion = {
  title: string;
  year: number;
  index: number;
  context: string | null;
  alternativesIntroduction: string;
  correctAlternative: string;
  alternatives: (EnemAlternative & { isCorrect: boolean })[];
};

@Injectable()
export class EnemQuestionsService {
  async getPublicQuestion(reference: DiagnosticoQuestaoRecord) {
    const question = await this.fetchQuestion(reference);

    return {
      id: reference.id,
      year: question.year,
      index: question.index,
      language: reference.language,
      discipline: getEnemDisciplineByQuestionIndex(reference.questionIndex),
      context: question.context,
      question: question.alternativesIntroduction,
      title: question.title,
      alternatives: question.alternatives.map((alternative) => ({
        letter: alternative.letter,
        text: alternative.text,
        imageUrl: this.getTrustedImageUrl(alternative.file),
      })),
    };
  }

  async isAlternativeCorrect(
    reference: DiagnosticoQuestaoRecord,
    alternative: string,
  ) {
    const question = await this.fetchQuestion(reference);

    return question.correctAlternative.trim().toUpperCase() === alternative;
  }

  private async fetchQuestion(reference: DiagnosticoQuestaoRecord) {
    const sourceQuestion = this.getSourceQuestion(reference);
    const response = await fetch(
      `https://api.enem.dev/v1/exams/${sourceQuestion.year}/questions/${sourceQuestion.index}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) {
      throw new BadGatewayException(
        'Não foi possível carregar a questão do ENEM.',
      );
    }

    const payload: unknown = await response.json();
    if (!this.isEnemQuestion(payload)) {
      throw new BadGatewayException(
        'A questão do ENEM retornou em formato inválido.',
      );
    }

    return payload;
  }

  private getSourceQuestion(reference: DiagnosticoQuestaoRecord) {
    const fallback =
      sourceQuestionFallbacks[
        `${reference.questionYear}:${reference.questionIndex}`
      ];
    if (fallback) return fallback;

    return { year: reference.questionYear, index: reference.questionIndex };
  }

  private isEnemQuestion(payload: unknown): payload is EnemQuestion {
    if (!payload || typeof payload !== 'object') return false;

    const question = payload as Partial<EnemQuestion>;
    return (
      typeof question.title === 'string' &&
      typeof question.year === 'number' &&
      typeof question.index === 'number' &&
      (typeof question.context === 'string' || question.context === null) &&
      typeof question.alternativesIntroduction === 'string' &&
      typeof question.correctAlternative === 'string' &&
      Array.isArray(question.alternatives) &&
      question.alternatives.every(
        (alternative) =>
          typeof alternative?.letter === 'string' &&
          (typeof alternative.text === 'string' || alternative.text === null) &&
          (typeof alternative.file === 'string' || alternative.file === null) &&
          typeof alternative.isCorrect === 'boolean',
      )
    );
  }

  private getTrustedImageUrl(url: string | null) {
    return url && this.isEnemImageUrl(url) ? url : null;
  }

  private isEnemImageUrl(url: string) {
    try {
      const imageUrl = new URL(url);
      return imageUrl.protocol === 'https:' && imageUrl.hostname === 'enem.dev';
    } catch {
      return false;
    }
  }
}
