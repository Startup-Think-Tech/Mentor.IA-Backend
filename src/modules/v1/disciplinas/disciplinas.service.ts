import { Injectable, NotFoundException } from '@nestjs/common';
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
}
