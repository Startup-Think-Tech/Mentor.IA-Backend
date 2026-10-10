import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AdminGuard } from '../../disciplinas/guards/admin.guard';
import { DesempenhoQueryDto } from './dto/desempenho-query.dto';
import { DesempenhoResponseDto } from './dto/desempenho-response.dto';
import { DesempenhosService } from './desempenhos.service';

@ApiTags('Diagnósticos - Desempenhos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diagnosticos/desempenhos')
export class DesempenhosController {
  constructor(private readonly desempenhosService: DesempenhosService) {}

  @Get()
  @ApiOperation({
    summary: 'Consulta o desempenho atual do aluno',
    description:
      'Retorna o registro mais recente por disciplina/conteúdo. Aceita diagnostico_id como filtro opcional.',
  })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findCurrent(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findCurrent(user.id, query.diagnostico_id);
  }

  @Get('historico')
  @ApiOperation({
    summary: 'Consulta o histórico de desempenho do aluno',
    description:
      'Preserva todos os registros históricos e aceita diagnostico_id como filtro opcional.',
  })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findHistory(user.id, query.diagnostico_id);
  }

  @Get('disciplinas/:id')
  @ApiOperation({
    summary: 'Consulta o desempenho atual do aluno em uma disciplina',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID da disciplina.' })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findByDiscipline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) disciplinaId: string,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findByDiscipline(
      user.id,
      disciplinaId,
      query.diagnostico_id,
    );
  }
}

@ApiTags('Admin - Diagnósticos - Desempenhos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/alunos/:alunoId/diagnosticos/desempenhos')
export class AdminDesempenhosController {
  constructor(private readonly desempenhosService: DesempenhosService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta o desempenho atual de um aluno' })
  @ApiParam({ name: 'alunoId', format: 'uuid' })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findCurrent(
    @Param('alunoId', ParseUUIDPipe) alunoId: string,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findCurrent(alunoId, query.diagnostico_id);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Consulta o histórico de desempenho de um aluno' })
  @ApiParam({ name: 'alunoId', format: 'uuid' })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findHistory(
    @Param('alunoId', ParseUUIDPipe) alunoId: string,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findHistory(alunoId, query.diagnostico_id);
  }

  @Get('disciplinas/:id')
  @ApiOperation({ summary: 'Consulta o desempenho de um aluno por disciplina' })
  @ApiParam({ name: 'alunoId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID da disciplina.' })
  @ApiOkResponse({ type: [DesempenhoResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findByDiscipline(
    @Param('alunoId', ParseUUIDPipe) alunoId: string,
    @Param('id', ParseUUIDPipe) disciplinaId: string,
    @Query() query: DesempenhoQueryDto,
  ) {
    return this.desempenhosService.findByDiscipline(
      alunoId,
      disciplinaId,
      query.diagnostico_id,
    );
  }
}
