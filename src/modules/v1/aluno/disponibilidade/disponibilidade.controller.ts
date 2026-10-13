import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  DisponibilidadeDiaDto,
  SubstituirDisponibilidadeDto,
} from './dto/substituir-disponibilidade.dto';
import { DisponibilidadeService } from './disponibilidade.service';

@ApiTags('Disponibilidade')
@ApiBearerAuth('bearer')
@ApiExtraModels(DisponibilidadeDiaDto)
@Controller('alunos/me/disponibilidade')
@UseGuards(JwtAuthGuard)
export class DisponibilidadeController {
  constructor(
    private readonly disponibilidadeService: DisponibilidadeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consulta a disponibilidade semanal do aluno' })
  @ApiOkResponse({
    description: 'Disponibilidade semanal em ordem de dia da semana.',
    type: [DisponibilidadeDiaDto],
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.disponibilidadeService.findWeeklyAvailability(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Substitui a disponibilidade semanal do aluno',
    description:
      'Envie exatamente os sete dias (0=domingo, 1=segunda, ..., 6=sábado). Minutos podem ser 0 para dias indisponíveis.',
  })
  @ApiBody({
    type: SubstituirDisponibilidadeDto,
    examples: {
      semanaExemplo: {
        summary: 'Exemplo de semana completa',
        value: {
          disponibilidades: [
            { diaSemana: 0, minutosDisponiveis: 0 },
            { diaSemana: 1, minutosDisponiveis: 60 },
            { diaSemana: 2, minutosDisponiveis: 60 },
            { diaSemana: 3, minutosDisponiveis: 90 },
            { diaSemana: 4, minutosDisponiveis: 60 },
            { diaSemana: 5, minutosDisponiveis: 90 },
            { diaSemana: 6, minutosDisponiveis: 120 },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Disponibilidade atualizada e indicação de eventual recálculo do cronograma ativo.',
    schema: {
      type: 'object',
      properties: {
        disponibilidades: {
          type: 'array',
          items: { $ref: getSchemaPath(DisponibilidadeDiaDto) },
        },
        cronogramaPrecisaRecalculo: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Dias inválidos, repetidos ou minutos fora do intervalo permitido.',
  })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  replaceMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() disponibilidadeDto: SubstituirDisponibilidadeDto,
  ) {
    return this.disponibilidadeService.replaceWeeklyAvailability(
      user.id,
      disponibilidadeDto,
    );
  }
}
