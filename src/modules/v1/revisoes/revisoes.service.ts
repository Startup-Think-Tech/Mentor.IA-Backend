import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResultadoRevisaoTipo, RevisaoStatus } from '@prisma/client';
import { revisaoEstaVencida } from './useCases/revisao-intervalos';
import { RevisoesRepository, type RevisaoRecord } from './revisoes.repository';

@Injectable()
export class RevisoesService {
  constructor(private readonly repository: RevisoesRepository) {}

  async listar(alunoId: string, cronogramaId: string) {
    const registros = await this.repository.listar(alunoId, cronogramaId);
    return registros.map((registro) => this.toResponse(registro));
  }

  async pendentes(alunoId: string, cronogramaId: string) {
    const registros = await this.repository.pendentes(alunoId, cronogramaId);
    return registros.map((registro) => this.toResponse(registro));
  }

  async atrasadas(alunoId: string, cronogramaId: string) {
    const registros = await this.repository.atrasadas(alunoId, cronogramaId);
    return registros.map((registro) => this.toResponse(registro));
  }

  async historico(alunoId: string, cronogramaId: string) {
    const registros = await this.repository.historico(alunoId, cronogramaId);
    return registros.map((registro) => this.toResponse(registro));
  }

  async buscar(alunoId: string, cronogramaId: string, revisaoId: string) {
    const revisao = await this.repository.buscar(
      alunoId,
      cronogramaId,
      revisaoId,
    );
    if (!revisao) throw new NotFoundException('Revisão não encontrada.');
    return this.toResponse(revisao);
  }

  async registrarResultado(
    alunoId: string,
    cronogramaId: string,
    revisaoId: string,
    resultado: ResultadoRevisaoTipo,
  ) {
    const operacao = await this.repository.registrarResultado(
      alunoId,
      cronogramaId,
      revisaoId,
      resultado,
    );
    switch (operacao.kind) {
      case 'not_found':
        throw new NotFoundException('Revisão não encontrada.');
      case 'conflict':
        throw new ConflictException(
          'Revisão encerrada, cancelada, substituída ou resultado incompatível.',
        );
      case 'not_due':
        throw new ConflictException(
          'A revisão ainda não está prevista para hoje.',
        );
      case 'future_session':
        throw new ConflictException(
          'A sessão vinculada à revisão está agendada para um dia futuro.',
        );
      case 'ok':
        return {
          revisao: this.toResponse(operacao.revisao),
          proximaRevisao: this.toResponse(operacao.proximaRevisao),
          repetido: operacao.repetido,
        };
    }
  }

  private toResponse(revisao: RevisaoRecord, agora = new Date()) {
    return {
      id: revisao.id,
      cronogramaId: revisao.cronogramaId,
      disciplina: revisao.disciplina,
      conteudo: revisao.conteudo,
      intervaloAtual: revisao.intervaloAtual,
      proximaRevisaoEm: revisao.proximaRevisaoEm,
      status:
        (revisao.status === RevisaoStatus.PENDENTE ||
          revisao.status === RevisaoStatus.ATRASADA) &&
        revisaoEstaVencida(revisao.proximaRevisaoEm, agora)
          ? RevisaoStatus.ATRASADA
          : revisao.status,
      resultados: revisao.resultados,
      criadoEm: revisao.criadoEm,
      atualizadoEm: revisao.atualizadoEm,
    };
  }
}
