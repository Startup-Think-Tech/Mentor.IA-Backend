import { ResultadoRevisaoTipo } from '@prisma/client';
import {
  dataRevisaoUtc,
  inicioDiaUtc,
  proximoIntervalo,
  revisaoEstaVencida,
} from './revisao-intervalos';

describe('regras de revisão espaçada', () => {
  it.each([
    [1, 3],
    [3, 7],
    [7, 14],
    [14, 30],
    [30, 30],
  ])('avança intervalo %i para %i quando BOM', (atual, esperado) => {
    expect(proximoIntervalo(atual, ResultadoRevisaoTipo.BOM)).toBe(esperado);
    expect(proximoIntervalo(atual, ResultadoRevisaoTipo.FACIL)).toBe(esperado);
  });

  it.each([1, 3, 7, 14, 30])('mantém intervalo %i se DIFICIL', (atual) => {
    expect(proximoIntervalo(atual, ResultadoRevisaoTipo.DIFICIL)).toBe(atual);
  });

  it.each([1, 3, 7, 14, 30])('reinicia intervalo %i se ERROU', (atual) => {
    expect(proximoIntervalo(atual, ResultadoRevisaoTipo.ERROU)).toBe(1);
  });

  it('rejeita intervalo não previsto', () => {
    expect(() => proximoIntervalo(2, ResultadoRevisaoTipo.BOM)).toThrow(
      RangeError,
    );
  });

  it('gera vencimento em dia UTC, incluindo virada de mês', () => {
    expect(
      dataRevisaoUtc(new Date('2026-10-31T23:59:00Z'), 3).toISOString(),
    ).toBe('2026-11-03T12:00:00.000Z');
  });

  it('marca atraso somente a partir do dia seguinte', () => {
    const vencimento = new Date('2026-10-16T12:00:00Z');
    expect(
      revisaoEstaVencida(vencimento, new Date('2026-10-16T23:59:59Z')),
    ).toBe(false);
    expect(
      revisaoEstaVencida(vencimento, new Date('2026-10-17T00:00:00Z')),
    ).toBe(true);
    expect(inicioDiaUtc(new Date('2026-10-16T19:00:00Z')).toISOString()).toBe(
      '2026-10-16T00:00:00.000Z',
    );
  });
});
