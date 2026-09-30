import { Injectable, NotFoundException } from '@nestjs/common';
import { GapRecord, GapsRepository } from './gaps.repository';

@Injectable()
export class GapsService {
  constructor(private readonly gapsRepository: GapsRepository) {}

  async findCurrent(alunoId: string) {
    const historico = await this.gapsRepository.findAlunoGapHistory(alunoId);
    const gapsAtuais = new Set<string>();

    return historico
      .filter((gap) => {
        const key = `${gap.disciplinaId}:${gap.conteudoId}`;
        if (gapsAtuais.has(key)) {
          return false;
        }

        gapsAtuais.add(key);
        return true;
      })
      .map((gap) => this.toResponse(gap));
  }

  async findHistory(alunoId: string) {
    const historico = await this.gapsRepository.findAlunoGapHistory(alunoId);
    return historico.map((gap) => this.toResponse(gap));
  }

  async findOne(alunoId: string, id: string) {
    const gap = await this.gapsRepository.findAlunoGapById(alunoId, id);
    if (!gap) {
      throw new NotFoundException('Gap não encontrado.');
    }

    return this.toResponse(gap);
  }

  private toResponse(gap: GapRecord) {
    return {
      id: gap.id,
      disciplina: gap.disciplina,
      conteudo: gap.conteudo,
      desempenho: gap.desempenho.toNumber(),
      pontuacaoGap: gap.pontuacaoGap.toNumber(),
      pontuacaoUrgencia: gap.pontuacaoUrgencia.toNumber(),
      pontuacaoPrioridade: gap.pontuacaoPrioridade.toNumber(),
      nivelPrioridade: gap.nivelPrioridade,
      calculadoEm: gap.calculadoEm,
    };
  }
}
