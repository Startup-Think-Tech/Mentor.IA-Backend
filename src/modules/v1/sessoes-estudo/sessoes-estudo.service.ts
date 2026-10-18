import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessaoEstudoStatus } from '@prisma/client';
import { ListarSessoesEstudoDto } from './dto/listar-sessoes-estudo.dto';
import { SessoesEstudoRepository } from './sessoes-estudo.repository';

@Injectable()
export class SessoesEstudoService {
  constructor(private readonly repository: SessoesEstudoRepository) {}

  listar(alunoId: string, query: ListarSessoesEstudoDto) {
    return this.repository.listar(alunoId, query);
  }

  hoje(alunoId: string) {
    return this.repository.hoje(alunoId);
  }

  async buscar(alunoId: string, id: string) {
    const sessao = await this.repository.buscar(alunoId, id);
    if (!sessao)
      throw new NotFoundException('Sessão de estudo não encontrada.');
    return sessao;
  }

  concluir(alunoId: string, id: string) {
    return this.transicionar(alunoId, id, SessaoEstudoStatus.CONCLUIDA);
  }

  perder(alunoId: string, id: string) {
    return this.transicionar(alunoId, id, SessaoEstudoStatus.PERDIDA);
  }

  private async transicionar(
    alunoId: string,
    id: string,
    status:
      typeof SessaoEstudoStatus.CONCLUIDA | typeof SessaoEstudoStatus.PERDIDA,
  ) {
    const resultado = await this.repository.alterarStatus(alunoId, id, status);
    switch (resultado.kind) {
      case 'not_found':
        throw new NotFoundException('Sessão de estudo não encontrada.');
      case 'conflict':
        throw new ConflictException(
          'A sessão não está pendente e não pode mudar de status.',
        );
      case 'future':
        throw new ConflictException(
          'Não é possível encerrar uma sessão de um dia futuro.',
        );
      case 'no_active_schedule':
        throw new ConflictException(
          'Não existe cronograma ativo para iniciar a revisão.',
        );
      case 'review_requires_result':
        throw new ConflictException(
          'Para concluir uma revisão, registre seu resultado no módulo de revisões.',
        );
      case 'ok':
        return resultado.sessao;
    }
  }
}
