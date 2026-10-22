import { NivelPrioridade } from '@prisma/client';

export type GapCalculado = {
  desempenho: number;
  pontuacaoGap: number;
  pontuacaoUrgencia: number;
  pontuacaoPrioridade: number;
  nivelPrioridade: NivelPrioridade;
};

function percentualValido(valor: number, campo: string): number {
  if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new RangeError(`${campo} deve estar entre 0 e 100.`);
  }

  return Number(valor.toFixed(2));
}

/**
 * A urgencia ainda nao possui sinal temporal (prazos/revisoes) no diagnostico.
 * Como criterio inicial deterministico, usa a intensidade do proprio gap.
 * O parametro urgencia permite substituir esse proxy quando houver dados reais.
 */
export function calcularGap(
  desempenhoInformado: number,
  urgenciaInformada?: number,
): GapCalculado {
  const desempenho = percentualValido(desempenhoInformado, 'Desempenho');
  const pontuacaoGap = Number((100 - desempenho).toFixed(2));
  const pontuacaoUrgencia = percentualValido(
    urgenciaInformada ?? pontuacaoGap,
    'Urgencia',
  );

  const pontuacaoPrioridade = Number(
    (pontuacaoGap * 0.7 + pontuacaoUrgencia * 0.3).toFixed(2),
  );

  let nivelPrioridade: NivelPrioridade;
  if (pontuacaoPrioridade >= 80) {
    nivelPrioridade = NivelPrioridade.CRITICA;
  } else if (pontuacaoPrioridade >= 60) {
    nivelPrioridade = NivelPrioridade.ALTA;
  } else if (pontuacaoPrioridade >= 30) {
    nivelPrioridade = NivelPrioridade.MEDIA;
  } else {
    nivelPrioridade = NivelPrioridade.BAIXA;
  }

  if (
    desempenho < 50 &&
    (nivelPrioridade === NivelPrioridade.BAIXA ||
      nivelPrioridade === NivelPrioridade.MEDIA)
  ) {
    nivelPrioridade = NivelPrioridade.ALTA;
  }

  return {
    desempenho,
    pontuacaoGap,
    pontuacaoUrgencia,
    pontuacaoPrioridade,
    nivelPrioridade,
  };
}
