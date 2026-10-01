import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateConteudoDto } from './dto/create-conteudo.dto';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateConteudoDto } from './dto/update-conteudo.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { DisciplinasRepository } from './disciplinas.repository';

@Injectable()
export class DisciplinasService {
  constructor(private readonly disciplinasRepository: DisciplinasRepository) {}

  findAll() {
    return this.disciplinasRepository.findActiveDisciplines();
  }

  async findOne(id: string) {
    const disciplina =
      await this.disciplinasRepository.findActiveDisciplineById(id);
    if (!disciplina) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return disciplina;
  }

  async findContents(disciplinaId: string) {
    await this.findOne(disciplinaId);
    return this.disciplinasRepository.findActiveContentsByDisciplineId(
      disciplinaId,
    );
  }

  findAllAdmin() {
    return this.disciplinasRepository.findAllDisciplinas();
  }

  async findOneAdmin(id: string) {
    const disciplina = await this.disciplinasRepository.findDisciplinaById(id);

    if (!disciplina) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return disciplina;
  }

  async createDisciplina(createDisciplinaDto: CreateDisciplinaDto) {
    try {
      return await this.disciplinasRepository.createDisciplina({
        ativo: createDisciplinaDto.ativo ?? true,
        codigo: this.normalizeCodigo(createDisciplinaDto.codigo),
        nome: this.normalizeNome(createDisciplinaDto.nome),
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  async updateDisciplina(id: string, updateDisciplinaDto: UpdateDisciplinaDto) {
    await this.findOneAdmin(id);

    try {
      return await this.disciplinasRepository.updateDisciplina(
        id,
        this.buildDisciplinaUpdateData(updateDisciplinaDto),
      );
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  async removeDisciplina(id: string) {
    await this.findOneAdmin(id);

    return this.disciplinasRepository.updateDisciplina(id, { ativo: false });
  }

  async findConteudosAdmin(id: string) {
    await this.findOneAdmin(id);

    return this.disciplinasRepository.findAllConteudosByDisciplinaId(id);
  }

  async createConteudo(id: string, createConteudoDto: CreateConteudoDto) {
    await this.findOneAdmin(id);

    try {
      return await this.disciplinasRepository.createConteudo(id, {
        ativo: createConteudoDto.ativo ?? true,
        nome: this.normalizeNome(createConteudoDto.nome),
      });
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  async updateConteudo(
    id: string,
    conteudoId: string,
    updateConteudoDto: UpdateConteudoDto,
  ) {
    await this.ensureConteudoBelongsToDisciplina(id, conteudoId);

    try {
      return await this.disciplinasRepository.updateConteudo(
        conteudoId,
        this.buildConteudoUpdateData(updateConteudoDto),
      );
    } catch (error) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  async removeConteudo(id: string, conteudoId: string) {
    await this.ensureConteudoBelongsToDisciplina(id, conteudoId);

    return this.disciplinasRepository.updateConteudo(conteudoId, {
      ativo: false,
    });
  }

  private async ensureConteudoBelongsToDisciplina(
    disciplinaId: string,
    conteudoId: string,
  ) {
    await this.findOneAdmin(disciplinaId);
    const conteudo =
      await this.disciplinasRepository.findConteudoById(conteudoId);

    if (!conteudo || conteudo.disciplinaId !== disciplinaId) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }

    return conteudo;
  }

  private buildDisciplinaUpdateData(
    updateDisciplinaDto: UpdateDisciplinaDto,
  ): Prisma.DisciplinaUpdateInput {
    const data: Prisma.DisciplinaUpdateInput = {};

    if (updateDisciplinaDto.nome !== undefined) {
      data.nome = this.normalizeNome(updateDisciplinaDto.nome);
    }

    if (updateDisciplinaDto.codigo !== undefined) {
      data.codigo = this.normalizeCodigo(updateDisciplinaDto.codigo);
    }

    if (updateDisciplinaDto.ativo !== undefined) {
      data.ativo = updateDisciplinaDto.ativo;
    }

    return data;
  }

  private buildConteudoUpdateData(
    updateConteudoDto: UpdateConteudoDto,
  ): Prisma.ConteudoUpdateInput {
    const data: Prisma.ConteudoUpdateInput = {};

    if (updateConteudoDto.nome !== undefined) {
      data.nome = this.normalizeNome(updateConteudoDto.nome);
    }

    if (updateConteudoDto.ativo !== undefined) {
      data.ativo = updateConteudoDto.ativo;
    }

    return data;
  }

  private normalizeNome(nome: string) {
    return nome.trim();
  }

  private normalizeCodigo(codigo: string) {
    return codigo.trim().toLowerCase();
  }

  private handleUniqueConstraintError(error: unknown) {
    if (this.disciplinasRepository.isUniqueConstraintError(error)) {
      throw new ConflictException('Disciplina ou conteúdo já cadastrado.');
    }
  }
}
