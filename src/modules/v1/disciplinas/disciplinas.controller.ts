import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConteudoDto } from './dto/create-conteudo.dto';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateConteudoDto } from './dto/update-conteudo.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { DisciplinasService } from './disciplinas.service';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Disciplinas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar disciplinas ativas',
    description: 'Retorna o catálogo ativo disponível ao aluno autenticado.',
  })
  @ApiOkResponse({ description: 'Lista de disciplinas ativas.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  findAll() {
    return this.disciplinasService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar disciplina ativa' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Disciplina encontrada.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findOnePublic(id);
  }

  @Get(':id/conteudos')
  @ApiOperation({
    summary: 'Listar conteúdos ativos de uma disciplina',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Lista de conteúdos ativos.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  findConteudos(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findConteudosPublic(id);
  }
}

@ApiTags('Admin - Disciplinas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/disciplinas')
export class AdminDisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas as disciplinas',
    description: 'Inclui disciplinas ativas e inativas. Requer papel ADMIN.',
  })
  @ApiOkResponse({ description: 'Lista completa de disciplinas.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findAll() {
    return this.disciplinasService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar disciplina pelo painel administrativo' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Disciplina encontrada.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar disciplina' })
  @ApiCreatedResponse({ description: 'Disciplina criada com sucesso.' })
  @ApiConflictResponse({
    description: 'Disciplina ou conteúdo já cadastrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  create(@Body() createDisciplinaDto: CreateDisciplinaDto) {
    return this.disciplinasService.createDisciplina(createDisciplinaDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar disciplina' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Disciplina atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiConflictResponse({
    description: 'Disciplina ou conteúdo já cadastrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDisciplinaDto: UpdateDisciplinaDto,
  ) {
    return this.disciplinasService.updateDisciplina(id, updateDisciplinaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Inativar disciplina',
    description:
      'Realiza inativação lógica para preservar vínculos e histórico acadêmico.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Disciplina inativada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.removeDisciplina(id);
  }

  @Get(':id/conteudos')
  @ApiOperation({
    summary: 'Listar conteúdos da disciplina no painel',
    description: 'Inclui conteúdos ativos e inativos.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiOkResponse({ description: 'Lista completa de conteúdos.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  findConteudos(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findConteudosAdmin(id);
  }

  @Post(':id/conteudos')
  @ApiOperation({ summary: 'Criar conteúdo em uma disciplina' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiCreatedResponse({ description: 'Conteúdo criado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiConflictResponse({
    description: 'Disciplina ou conteúdo já cadastrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  createConteudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createConteudoDto: CreateConteudoDto,
  ) {
    return this.disciplinasService.createConteudo(id, createConteudoDto);
  }

  @Patch(':id/conteudos/:conteudoId')
  @ApiOperation({ summary: 'Atualizar conteúdo de uma disciplina' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiParam({
    name: 'conteudoId',
    format: 'uuid',
    description: 'ID do conteúdo.',
  })
  @ApiOkResponse({ description: 'Conteúdo atualizado com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Disciplina ou conteúdo não encontrado.',
  })
  @ApiConflictResponse({
    description: 'Disciplina ou conteúdo já cadastrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  updateConteudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conteudoId', ParseUUIDPipe) conteudoId: string,
    @Body() updateConteudoDto: UpdateConteudoDto,
  ) {
    return this.disciplinasService.updateConteudo(
      id,
      conteudoId,
      updateConteudoDto,
    );
  }

  @Delete(':id/conteudos/:conteudoId')
  @ApiOperation({
    summary: 'Inativar conteúdo',
    description:
      'Realiza inativação lógica para preservar vínculos e histórico acadêmico.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID da disciplina.' })
  @ApiParam({
    name: 'conteudoId',
    format: 'uuid',
    description: 'ID do conteúdo.',
  })
  @ApiOkResponse({ description: 'Conteúdo inativado com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Disciplina ou conteúdo não encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a administradores.' })
  removeConteudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conteudoId', ParseUUIDPipe) conteudoId: string,
  ) {
    return this.disciplinasService.removeConteudo(id, conteudoId);
  }
}
