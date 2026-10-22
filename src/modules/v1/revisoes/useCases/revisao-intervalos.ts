import { ResultadoRevisaoTipo } from '@prisma/client';

export const INTERVALOS_REVISAO = [1, 3, 7, 14, 30] as const;

export function proximoIntervalo(
  atual: number,
  resultado: ResultadoRevisaoTipo,
): number {
  const indice = INTERVALOS_REVISAO.findIndex((dias) => dias === atual);
  if (indice === -1) {
    throw new RangeError('Intervalo de revisão inválido.');
  }
  if (resultado === ResultadoRevisaoTipo.ERROU) return 1;
  if (resultado === ResultadoRevisaoTipo.DIFICIL) return atual;
  return INTERVALOS_REVISAO[
    Math.min(indice + 1, INTERVALOS_REVISAO.length - 1)
  ];
}

export function inicioDiaUtc(data: Date): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
  );
}

export function dataRevisaoUtc(data: Date, intervaloDias: number): Date {
  const inicio = inicioDiaUtc(data);
  inicio.setUTCDate(inicio.getUTCDate() + intervaloDias);
  inicio.setUTCHours(12);
  return inicio;
}

export function revisaoEstaVencida(vencimento: Date, agora: Date): boolean {
  return vencimento.getTime() < inicioDiaUtc(agora).getTime();
}
