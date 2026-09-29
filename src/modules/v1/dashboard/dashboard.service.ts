import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AlunoPapel } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardQueryDto } from './dashboard-query.dto';
import { DashboardRepository } from './dashboard.repository';

type DashboardVisao = 'resumo' | 'historico';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(
    visao: string,
    query: DashboardQueryDto,
    user: AuthenticatedUser,
  ) {
    if (!this.isValidVisao(visao)) {
      throw new BadRequestException(
        'Visão inválida. Use "resumo" ou "historico".',
      );
    }

    if (
      visao === 'resumo' &&
      (query.pagina !== undefined || query.limite !== undefined)
    ) {
      throw new BadRequestException(
        'Os filtros pagina e limite são aceitos apenas na visão historico.',
      );
    }

    const alunoId = this.resolveAlunoId(query.aluno_id, user);
    const inicio = query.inicio ? new Date(query.inicio) : undefined;
    const fim = query.fim ? new Date(query.fim) : undefined;

    if (inicio && fim && inicio > fim) {
      throw new BadRequestException(
        'O filtro inicio não pode ser posterior ao filtro fim.',
      );
    }

    const filters = {
      alunoId,
      disciplinaId: query.disciplina_id,
      inicio,
      fim,
    };

    if (visao === 'resumo') {
      return {
        visao,
        aluno_id: alunoId,
        filtros: this.responseFilters(query),
        dados: await this.dashboardRepository.getResumo(filters),
      };
    }

    const pagina = query.pagina ?? 1;
    const limite = query.limite ?? 20;

    return {
      visao,
      aluno_id: alunoId,
      filtros: this.responseFilters(query),
      dados: await this.dashboardRepository.getHistorico(
        filters,
        pagina,
        limite,
      ),
    };
  }

  private resolveAlunoId(
    requestedAlunoId: string | undefined,
    user: AuthenticatedUser,
  ) {
    if (!requestedAlunoId) {
      return user.id;
    }

    if (requestedAlunoId !== user.id && user.papel !== AlunoPapel.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem consultar o dashboard de outro aluno.',
      );
    }

    return requestedAlunoId;
  }

  private responseFilters(query: DashboardQueryDto) {
    return {
      inicio: query.inicio ?? null,
      fim: query.fim ?? null,
      disciplina_id: query.disciplina_id ?? null,
    };
  }

  private isValidVisao(visao: string): visao is DashboardVisao {
    return visao === 'resumo' || visao === 'historico';
  }
}
