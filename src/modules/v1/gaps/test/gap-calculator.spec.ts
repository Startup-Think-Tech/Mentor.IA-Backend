import { NivelPrioridade } from '@prisma/client';
import { calcularGap } from '../useCases/gap-calculator';

describe('calcularGap', () => {
  it.each([
    [100, 0, NivelPrioridade.BAIXA],
    [85, 15, NivelPrioridade.BAIXA],
    [70, 30, NivelPrioridade.MEDIA],
    [50, 50, NivelPrioridade.MEDIA],
    [40, 60, NivelPrioridade.ALTA],
    [20, 80, NivelPrioridade.CRITICA],
    [0, 100, NivelPrioridade.CRITICA],
  ])(
    'classifica desempenho %s com gap %s como %s',
    (desempenho, pontuacao, nivelPrioridade) => {
      expect(calcularGap(desempenho)).toMatchObject({
        desempenho,
        pontuacaoGap: pontuacao,
        pontuacaoUrgencia: pontuacao,
        pontuacaoPrioridade: pontuacao,
        nivelPrioridade,
      });
    },
  );

  it('aplica os pesos 70/30 ao receber urgencia real', () => {
    expect(calcularGap(60, 100)).toMatchObject({
      pontuacaoGap: 40,
      pontuacaoUrgencia: 100,
      pontuacaoPrioridade: 58,
      nivelPrioridade: NivelPrioridade.MEDIA,
    });
  });

  it('forca ALTA quando desempenho esta abaixo de 50, mesmo com urgencia zero', () => {
    expect(calcularGap(49.99, 0)).toMatchObject({
      pontuacaoGap: 50.01,
      pontuacaoPrioridade: 35.01,
      nivelPrioridade: NivelPrioridade.ALTA,
    });
  });

  it('nao forca ALTA no limite exato de 50', () => {
    expect(calcularGap(50, 0).nivelPrioridade).toBe(NivelPrioridade.MEDIA);
  });

  it('arredonda as pontuacoes a duas casas', () => {
    expect(calcularGap(66.666, 20)).toMatchObject({
      desempenho: 66.67,
      pontuacaoGap: 33.33,
      pontuacaoPrioridade: 29.33,
    });
  });

  it.each([NaN, Infinity, -1, 100.01])(
    'rejeita desempenho fora do intervalo: %s',
    (desempenho) => {
      expect(() => calcularGap(desempenho)).toThrow(RangeError);
    },
  );

  it.each([NaN, Infinity, -1, 100.01])(
    'rejeita urgencia fora do intervalo: %s',
    (urgencia) => {
      expect(() => calcularGap(80, urgencia)).toThrow(RangeError);
    },
  );
});
