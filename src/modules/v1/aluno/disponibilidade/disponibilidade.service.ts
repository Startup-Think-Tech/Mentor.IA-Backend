import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubstituirDisponibilidadeDto } from './dto/substituir-disponibilidade.dto';
import { DisponibilidadeRepository } from './disponibilidade.repository';

@Injectable()
export class DisponibilidadeService {
  constructor(
    private readonly disponibilidadeRepository: DisponibilidadeRepository,
  ) {}

  findWeeklyAvailability(alunoId: string) {
    return this.disponibilidadeRepository.findActiveAlunoWeeklyAvailability(
      alunoId,
    );
  }

  async replaceWeeklyAvailability(
    alunoId: string,
    disponibilidadeDto: SubstituirDisponibilidadeDto,
  ) {
    const disponibilidades = [...disponibilidadeDto.disponibilidades].sort(
      (first, second) => first.diaSemana - second.diaSemana,
    );
    if (!hasCompleteWeek(disponibilidades)) {
      throw new BadRequestException(
        'A disponibilidade deve informar cada dia da semana uma única vez.',
      );
    }

    const disponibilidade =
      await this.disponibilidadeRepository.replaceActiveAlunoWeeklyAvailability(
        alunoId,
        disponibilidades,
      );
    if (!disponibilidade) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return disponibilidade;
  }
}

function hasCompleteWeek(disponibilidades: { diaSemana: number }[]) {
  return (
    disponibilidades.length === 7 &&
    disponibilidades.every(
      (disponibilidade, index) => disponibilidade.diaSemana === index,
    )
  );
}
