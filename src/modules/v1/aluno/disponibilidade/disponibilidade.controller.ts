import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Substitui a disponibilidade semanal do aluno' })
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
