import { SessaoEstudoTipo } from '@prisma/client';
import { planejarSessoes } from './cronograma-engine';

const inicio = new Date('2026-10-19T12:00:00.000Z');
const disponibilidades = [
  { diaSemana: 0, minutosDisponiveis: 0 },
  { diaSemana: 1, minutosDisponiveis: 120 },
  { diaSemana: 2, minutosDisponiveis: 0 },
  { diaSemana: 3, minutosDisponiveis: 45 },
  { diaSemana: 4, minutosDisponiveis: 60 },
  { diaSemana: 5, minutosDisponiveis: 0 },
  { diaSemana: 6, minutosDisponiveis: 0 },
];
const gaps = [
  {
    disciplinaId: 'mat',
    conteudoId: 'fun',
    desempenho: 20,
    pontuacaoPrioridade: 80,
  },
  {
    disciplinaId: 'por',
    conteudoId: 'lit',
    desempenho: 50,
    pontuacaoPrioridade: 50,
  },
  {
    disciplinaId: 'his',
    conteudoId: 'brasil',
    desempenho: 70,
    pontuacaoPrioridade: 30,
  },
];

describe('planejarSessoes', () => {
  it('respeita disponibilidade e limite por disciplina', () => {
    const sessoes = planejarSessoes({
      dataInicio: inicio,
      dias: 7,
      disponibilidades,
      gaps,
      revisoes: [],
    });
    expect(sessoes).toHaveLength(7);
    const porDia = new Map<string, typeof sessoes>();
    for (const sessao of sessoes) {
      const dia = sessao.agendadoPara.toISOString().slice(0, 10);
      porDia.set(dia, [...(porDia.get(dia) ?? []), sessao]);
      expect(sessao.duracaoMinutos).toBe(30);
      expect(sessao.tipo).toBe(SessaoEstudoTipo.ESTUDO);
    }
    expect([...porDia.values()].map((itens) => itens.length)).toEqual([
      4, 1, 2,
    ]);
    for (const itens of porDia.values()) {
      for (const disciplina of new Set(itens.map((s) => s.disciplinaId))) {
        expect(
          itens.filter((s) => s.disciplinaId === disciplina).length,
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it('prioriza revisoes vencidas sem antecipar futuras', () => {
    const sessoes = planejarSessoes({
      dataInicio: inicio,
      dias: 1,
      disponibilidades,
      gaps,
      revisoes: [
        {
          id: 'nova',
          disciplinaId: 'his',
          conteudoId: 'brasil',
          proximaRevisaoEm: new Date('2026-10-19T09:00:00Z'),
        },
        {
          id: 'antiga',
          disciplinaId: 'por',
          conteudoId: 'lit',
          proximaRevisaoEm: new Date('2026-10-17T09:00:00Z'),
        },
        {
          id: 'futura',
          disciplinaId: 'mat',
          conteudoId: 'fun',
          proximaRevisaoEm: new Date('2026-10-20T12:00:00Z'),
        },
      ],
    });
    expect(sessoes[0].revisaoOriginalId).toBe('antiga');
    expect(sessoes[1].revisaoOriginalId).toBe('nova');
    expect(sessoes.some((s) => s.revisaoOriginalId === 'futura')).toBe(false);
  });

  it('e deterministico mesmo mudando a ordem dos gaps', () => {
    const params = {
      dataInicio: inicio,
      dias: 7,
      disponibilidades,
      gaps,
      revisoes: [],
    };
    expect(planejarSessoes(params)).toEqual(
      planejarSessoes({ ...params, gaps: [...gaps].reverse() }),
    );
  });

  it('nao cria sessoes sem entradas e permite revisoes sem gaps', () => {
    const params = {
      dataInicio: inicio,
      dias: 7,
      disponibilidades,
      gaps: [],
      revisoes: [],
    };
    expect(planejarSessoes(params)).toEqual([]);
    const revisoes = [1, 2, 3].map((id) => ({
      id: String(id),
      disciplinaId: 'mat',
      conteudoId: 'fun',
      proximaRevisaoEm: new Date('2026-10-18T12:00:00Z'),
    }));
    const sessoes = planejarSessoes({ ...params, dias: 1, revisoes });
    expect(sessoes).toHaveLength(2);
  });
});
