import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardQueryDto } from './dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':visao')
  @ApiOperation({
    summary: 'Consultar dashboard do aluno',
    description:
      'Retorna a visão resumo ou histórico. Por padrão usa o aluno autenticado; aluno_id diferente exige papel ADMIN.',
  })
  @ApiParam({
    name: 'visao',
    enum: ['resumo', 'historico'],
    description: 'Visão do dashboard.',
  })
  @ApiOkResponse({
    description: 'Dashboard retornado com sucesso.',
    schema: {
      example: {
        visao: 'resumo',
        aluno_id: 'b7f7be1f-3bbb-4d1e-a0ef-9d6c7b57f4da',
        filtros: {
          inicio: null,
          fim: null,
          disciplina_id: null,
        },
        dados: {
          desempenho: {
            percentual_medio: 72.5,
            total_registros: 8,
          },
          gaps_por_prioridade: [],
          sessoes_por_status: [],
          revisoes_por_status: [],
          cronograma_atual: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Visão inválida, período inconsistente ou pagina/limite usados na visão resumo.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({
    description: 'Aluno comum tentou consultar o dashboard de outro aluno.',
  })
  getDashboard(
    @Param('visao') visao: string,
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getDashboard(visao, query, user);
  }
}
