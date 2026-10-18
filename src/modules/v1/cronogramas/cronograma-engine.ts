import { SessaoEstudoTipo } from '@prisma/client';

export const DURACAO_SESSAO_MINUTOS = 30;
export const MAX_SESSOES_DIA = 4;
export const MAX_SESSOES_DISCIPLINA_DIA = 2;

export type DisponibilidadePlanejamento = {
  diaSemana: number;
  minutosDisponiveis: number;
};
export type GapPlanejamento = {
  disciplinaId: string;
  conteudoId: string;
  desempenho: number;
  pontuacaoPrioridade: number;
};
export type RevisaoPlanejamento = {
  id: string;
  disciplinaId: string;
  conteudoId: string;
  proximaRevisaoEm: Date;
};
export type SessaoPlanejada = {
  disciplinaId: string;
  conteudoId: string;
  tipo: SessaoEstudoTipo;
  agendadoPara: Date;
  duracaoMinutos: number;
  revisaoOriginalId: string | null;
};

type Candidato = GapPlanejamento & { quantidadeAlocada: number };

function compararId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Usa datas UTC e blocos de 30 minutos. 12h UTC e apenas horario tecnico
 * de referencia: a disponibilidade atual nao informa turno nem fuso.
 */
export function planejarSessoes(params: {
  dataInicio: Date;
  dias: number;
  disponibilidades: DisponibilidadePlanejamento[];
  gaps: GapPlanejamento[];
  revisoes: RevisaoPlanejamento[];
}): SessaoPlanejada[] {
  const { dataInicio, dias, disponibilidades, gaps, revisoes } = params;
  const porDia = new Map(
    disponibilidades.map((dia) => [dia.diaSemana, dia.minutosDisponiveis]),
  );
  const candidatos: Candidato[] = gaps
    .filter((gap) => gap.pontuacaoPrioridade > 0)
    .map((gap) => ({ ...gap, quantidadeAlocada: 0 }));
  const pendentes = [...revisoes].sort(
    (a, b) =>
      a.proximaRevisaoEm.getTime() - b.proximaRevisaoEm.getTime() ||
      compararId(a.id, b.id),
  );
  const revisoesPlanejadas = new Set<string>();
  const sessoes: SessaoPlanejada[] = [];

  for (let dia = 0; dia < dias; dia++) {
    const data = new Date(dataInicio.getTime());
    data.setUTCDate(data.getUTCDate() + dia);
    const minutos = porDia.get(data.getUTCDay()) ?? 0;
    const quantidade = Math.min(
      MAX_SESSOES_DIA,
      Math.floor(minutos / DURACAO_SESSAO_MINUTOS),
    );
    const quantidadesPorDisciplina = new Map<string, number>();

    for (let slot = 0; slot < quantidade; slot++) {
      const podeAlocar = (disciplinaId: string) =>
        (quantidadesPorDisciplina.get(disciplinaId) ?? 0) <
        MAX_SESSOES_DISCIPLINA_DIA;

      const revisao = pendentes.find(
        (item) =>
          !revisoesPlanejadas.has(item.id) &&
          item.proximaRevisaoEm.getTime() <= data.getTime() &&
          podeAlocar(item.disciplinaId),
      );

      let disciplinaId: string;
      let conteudoId: string;
      let tipo: SessaoEstudoTipo;
      let revisaoOriginalId: string | null = null;

      if (revisao) {
        disciplinaId = revisao.disciplinaId;
        conteudoId = revisao.conteudoId;
        tipo = SessaoEstudoTipo.REVISAO;
        revisaoOriginalId = revisao.id;
        revisoesPlanejadas.add(revisao.id);
      } else {
        const escolhido = candidatos
          .filter((item) => podeAlocar(item.disciplinaId))
          .sort((a, b) => {
            const pesoA = a.pontuacaoPrioridade / (1 + a.quantidadeAlocada);
            const pesoB = b.pontuacaoPrioridade / (1 + b.quantidadeAlocada);
            return (
              pesoB - pesoA ||
              a.desempenho - b.desempenho ||
              compararId(a.disciplinaId, b.disciplinaId) ||
              compararId(a.conteudoId, b.conteudoId)
            );
          })[0];
        if (!escolhido) break;

        escolhido.quantidadeAlocada++;
        disciplinaId = escolhido.disciplinaId;
        conteudoId = escolhido.conteudoId;
        tipo = SessaoEstudoTipo.ESTUDO;
      }

      sessoes.push({
        disciplinaId,
        conteudoId,
        tipo,
        agendadoPara: new Date(
          data.getTime() + slot * DURACAO_SESSAO_MINUTOS * 60_000,
        ),
        duracaoMinutos: DURACAO_SESSAO_MINUTOS,
        revisaoOriginalId,
      });
      quantidadesPorDisciplina.set(
        disciplinaId,
        (quantidadesPorDisciplina.get(disciplinaId) ?? 0) + 1,
      );
    }
  }
  return sessoes;
}
