import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  findAllDisciplinas() {
    return this.prisma.disciplina.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  findDisciplinaById(id: string) {
    return this.prisma.disciplina.findUnique({
      where: { id },
    });
  }

  createDisciplina(data: Prisma.DisciplinaCreateInput) {
    return this.prisma.disciplina.create({ data });
  }

  updateDisciplina(id: string, data: Prisma.DisciplinaUpdateInput) {
    return this.prisma.disciplina.update({
      where: { id },
      data,
    });
  }

  findAllConteudosByDisciplinaId(disciplinaId: string) {
    return this.prisma.conteudo.findMany({
      where: { disciplinaId },
      orderBy: { nome: 'asc' },
    });
  }

  findConteudoById(id: string) {
    return this.prisma.conteudo.findUnique({
      where: { id },
    });
  }

  createConteudo(
    disciplinaId: string,
    data: Omit<Prisma.ConteudoCreateInput, 'disciplina'>,
  ) {
    return this.prisma.conteudo.create({
      data: {
        ...data,
        disciplina: {
          connect: { id: disciplinaId },
        },
      },
    });
  }

  updateConteudo(id: string, data: Prisma.ConteudoUpdateInput) {
    return this.prisma.conteudo.update({
      where: { id },
      data,
    });
  }

  isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
