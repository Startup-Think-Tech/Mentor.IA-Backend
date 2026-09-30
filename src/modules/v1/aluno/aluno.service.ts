import { Injectable, NotFoundException } from '@nestjs/common';
import { AlunoRepository } from './aluno.repository';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@Injectable()
export class AlunoService {
  constructor(private readonly alunoRepository: AlunoRepository) {}

  async findProfile(alunoId: string) {
    const aluno = await this.alunoRepository.findActiveProfileById(alunoId);
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return aluno;
  }

  async updateProfile(alunoId: string, updateAlunoDto: UpdateAlunoDto) {
    const aluno = await this.alunoRepository.updateActiveProfile(
      alunoId,
      updateAlunoDto.nome,
    );
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return aluno;
  }
}
