import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const gapSelect = {
  id: true,
  disciplinaId: true,
  conteudoId: true,
  desempenho: true,
  pontuacaoGap: true,
  pontuacaoUrgencia: true,
  pontuacaoPrioridade: true,
  nivelPrioridade: true,
  calculadoEm: true,
  disciplina: {
    select: {
      id: true,
      nome: true,
      codigo: true,
    },
  },
  conteudo: {
    select: {
      id: true,
      nome: true,
    },
  },
} satisfies Prisma.GapSelect;

export type GapRecord = Prisma.GapGetPayload<{ select: typeof gapSelect }>;

@Injectable()
export class GapsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAlunoGapHistory(alunoId: string) {
    return this.prisma.gap.findMany({
      where: { alunoId },
      orderBy: { calculadoEm: 'desc' },
      select: gapSelect,
    });
  }

  findAlunoGapById(alunoId: string, id: string) {
    return this.prisma.gap.findFirst({
      where: { alunoId, id },
      select: gapSelect,
    });
  }
}
