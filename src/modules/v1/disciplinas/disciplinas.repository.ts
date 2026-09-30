import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisciplinasRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveDisciplines() {
    return this.prisma.disciplina.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });
  }

  findActiveDisciplineById(id: string) {
    return this.prisma.disciplina.findFirst({
      where: { id, ativo: true },
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });
  }

  findActiveContentsByDisciplineId(disciplinaId: string) {
    return this.prisma.conteudo.findMany({
      where: {
        disciplinaId,
        ativo: true,
      },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
      },
    });
  }
}
