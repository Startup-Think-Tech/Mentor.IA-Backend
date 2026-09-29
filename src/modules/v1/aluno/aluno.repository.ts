import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlunoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveProfileById(id: string) {
    return this.prisma.aluno.findFirst({
      where: {
        id,
        excluidoEm: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
      },
    });
  }

  async updateActiveProfile(id: string, nome: string) {
    const { count } = await this.prisma.aluno.updateMany({
      where: {
        id,
        excluidoEm: null,
      },
      data: { nome },
    });
    if (count === 0) {
      return null;
    }

    return this.findActiveProfileById(id);
  }
}
