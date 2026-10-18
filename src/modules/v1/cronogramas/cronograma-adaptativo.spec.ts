import { CronogramaStatus, SessaoEstudoStatus } from '@prisma/client';
import { recalcularSessoesFuturas } from './cronograma-adaptativo';

const agora = new Date('2026-10-16T16:00:00.000Z');
const alunoId = 'a';
const cronogramaId = 'cronograma-1';

function mockTransaction(
  options: { fim?: Date | null; capacidade?: number } = {},
) {
  const updates = jest.fn().mockResolvedValue({ count: 4 });
  const creates = jest.fn().mockResolvedValue({ count: 4 });
  const tx = {
    cronograma: {
      findFirst: jest.fn().mockResolvedValue(
        options.fim === null
          ? null
          : {
              id: cronogramaId,
              validoAte: options.fim ?? new Date('2026-10-19T12:00:00Z'),
            },
      ),
    },
    disponibilidadeAluno: {
      findMany: jest.fn().mockResolvedValue(
        Array.from({ length: 7 }, (_, diaSemana) => ({
          diaSemana,
          minutosDisponiveis: options.capacidade ?? 60,
        })),
      ),
    },
    gap: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          disciplinaId: 'mat',
          conteudoId: 'geral',
          desempenho: { toNumber: () => 20 },
          pontuacaoPrioridade: { toNumber: () => 80 },
        },
        {
          id: 'g2',
          disciplinaId: 'por',
          conteudoId: 'geral',
          desempenho: { toNumber: () => 60 },
          pontuacaoPrioridade: { toNumber: () => 40 },
        },
      ]),
    },
    revisao: { findMany: jest.fn().mockResolvedValue([]) },
    sessaoEstudo: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: updates,
      createMany: creates,
    },
  };
  return { tx, updates, creates };
}

describe('recalcularSessoesFuturas', () => {
  it('replaneja o futuro no mesmo cronograma sem apagar historico', async () => {
    const { tx, updates, creates } = mockTransaction();
    const result = await recalcularSessoesFuturas(tx as never, alunoId, agora);
    expect(result).toEqual({
      recalculado: true,
      cronogramaId,
      sessoesCanceladas: 4,
      sessoesCriadas: 6,
    });
    expect(tx.cronograma.findFirst).toHaveBeenCalledWith({
      where: { alunoId, status: CronogramaStatus.ATIVO },
      select: { id: true, validoAte: true },
    });
    expect(updates).toHaveBeenCalledWith({
      where: {
        alunoId,
        cronogramaId,
        status: SessaoEstudoStatus.PENDENTE,
        agendadoPara: { gte: new Date('2026-10-17T12:00:00Z') },
      },
      data: { status: SessaoEstudoStatus.CANCELADA },
    });
    const chamada = creates.mock.calls[0] as [
      {
        data: Array<{
          agendadoPara: Date;
          cronogramaId: string;
          duracaoMinutos: number;
        }>;
      },
    ];
    const sessoes = chamada[0].data as Array<{
      agendadoPara: Date;
      cronogramaId: string;
      duracaoMinutos: number;
    }>;
    expect(sessoes).toHaveLength(6);
    expect(
      sessoes.every(
        (s) =>
          s.cronogramaId === cronogramaId &&
          s.duracaoMinutos === 30 &&
          s.agendadoPara >= new Date('2026-10-17T12:00:00Z'),
      ),
    ).toBe(true);
  });

  it('cancela pendencias futuras quando nao existe mais disponibilidade', async () => {
    const { tx, updates, creates } = mockTransaction({ capacidade: 0 });
    const result = await recalcularSessoesFuturas(tx as never, alunoId, agora);
    expect(result).toMatchObject({ recalculado: true, sessoesCriadas: 0 });
    expect(updates).toHaveBeenCalledTimes(1);
    expect(creates).not.toHaveBeenCalled();
  });

  it('nao altera historico sem cronograma ativo', async () => {
    const { tx, updates, creates } = mockTransaction({ fim: null });
    expect(await recalcularSessoesFuturas(tx as never, alunoId, agora)).toEqual(
      { recalculado: false, motivo: 'sem_cronograma' },
    );
    expect(updates).not.toHaveBeenCalled();
    expect(creates).not.toHaveBeenCalled();
  });

  it('nao altera o cronograma quando seu prazo acabou', async () => {
    const { tx, updates, creates } = mockTransaction({
      fim: new Date('2026-10-16T12:00:00Z'),
    });
    expect(await recalcularSessoesFuturas(tx as never, alunoId, agora)).toEqual(
      { recalculado: false, motivo: 'fora_do_periodo' },
    );
    expect(updates).not.toHaveBeenCalled();
    expect(creates).not.toHaveBeenCalled();
  });
});
