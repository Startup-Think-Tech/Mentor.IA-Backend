import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RegistrarResultadoRevisaoDto } from './dto/registrar-resultado-revisao.dto';
import { RevisoesService } from './revisoes.service';

@ApiTags('Revisões espaçadas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('cronogramas/:cronogramaId/revisoes')
export class RevisoesController {
  constructor(private readonly service: RevisoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar revisões de um cronograma do aluno' })
  @ApiUnauthorizedResponse({ description: 'JWT inválido ou ausente.' })
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
  ) {
    return this.service.listar(user.id, cronogramaId);
  }

  @Get('pendentes')
  @ApiOperation({ summary: 'Listar revisões pendentes (inclusive atrasadas)' })
  pendentes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
  ) {
    return this.service.pendentes(user.id, cronogramaId);
  }

  @Get('atrasadas')
  @ApiOperation({ summary: 'Listar revisões vencidas antes do dia UTC atual' })
  atrasadas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
  ) {
    return this.service.atrasadas(user.id, cronogramaId);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Listar revisões concluídas e canceladas' })
  historico(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
  ) {
    return this.service.historico(user.id, cronogramaId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar uma revisão por ID com vínculo ao aluno',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ description: 'Revisão não encontrada.' })
  buscar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.buscar(user.id, cronogramaId, id);
  }

  @Post(':id/resultado')
  @ApiOperation({
    summary: 'Registrar resultado e criar a próxima revisão espaçada',
    description:
      'ERROU=1 dia; DIFICIL mantém intervalo; BOM/FACIL avança até 30. ' +
      'Conclui também a sessão REVISAO correspondente, se agendada.',
  })
  @ApiConflictResponse({
    description: 'Revisão futura, finalizada ou cancelada.',
  })
  @ApiNotFoundResponse({ description: 'Revisão não encontrada.' })
  registrarResultado(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cronogramaId', ParseUUIDPipe) cronogramaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarResultadoRevisaoDto,
  ) {
    return this.service.registrarResultado(
      user.id,
      cronogramaId,
      id,
      dto.resultado,
    );
  }
}
