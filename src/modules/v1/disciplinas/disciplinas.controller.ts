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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConteudoDto } from './dto/create-conteudo.dto';
import { DisciplinasService } from './disciplinas.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateConteudoDto } from './dto/update-conteudo.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { AdminGuard } from './guards/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  findAll() {
    return this.disciplinasService.findAllPublic();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findOnePublic(id);
  }

  @Get(':id/conteudos')
  findConteudos(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findConteudosPublic(id);
  }
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/disciplinas')
export class AdminDisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  findAll() {
    return this.disciplinasService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findOneAdmin(id);
  }

  @Post()
  create(@Body() createDisciplinaDto: CreateDisciplinaDto) {
    return this.disciplinasService.createDisciplina(createDisciplinaDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDisciplinaDto: UpdateDisciplinaDto,
  ) {
    return this.disciplinasService.updateDisciplina(id, updateDisciplinaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.removeDisciplina(id);
  }

  @Get(':id/conteudos')
  findConteudos(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinasService.findConteudosAdmin(id);
  }

  @Post(':id/conteudos')
  createConteudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createConteudoDto: CreateConteudoDto,
  ) {
    return this.disciplinasService.createConteudo(id, createConteudoDto);
  }

  @Patch(':id/conteudos/:conteudoId')
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
  removeConteudo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conteudoId', ParseUUIDPipe) conteudoId: string,
  ) {
    return this.disciplinasService.removeConteudo(id, conteudoId);
  }
}
