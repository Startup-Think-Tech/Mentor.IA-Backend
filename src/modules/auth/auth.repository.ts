import { Injectable } from '@nestjs/common';
import { AlunoPapel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createAluno(data: { nome: string; email: string; senhaHash: string }) {
    return this.prisma.aluno.create({
      data: {
        email: data.email,
        nome: data.nome,
        papel: AlunoPapel.ALUNO,
        senhaHash: data.senhaHash,
      },
    });
  }

  findActiveAlunoByEmail(email: string) {
    return this.prisma.aluno.findFirst({
      where: {
        email,
        excluidoEm: null,
      },
    });
  }

  findActiveAlunoById(id: string) {
    return this.prisma.aluno.findFirst({
      where: {
        id,
        excluidoEm: null,
      },
    });
  }

  createPasswordReset(data: {
    alunoId: string;
    expiraEm: Date;
    tokenHash: string;
  }) {
    return this.prisma.recuperacaoSenha.create({
      data: {
        alunoId: data.alunoId,
        expiraEm: data.expiraEm,
        tokenHash: data.tokenHash,
      },
    });
  }

  findValidPasswordReset(tokenHash: string) {
    return this.prisma.recuperacaoSenha.findFirst({
      where: {
        expiraEm: {
          gt: new Date(),
        },
        tokenHash,
        usadoEm: null,
      },
    });
  }

  async resetPassword(params: {
    alunoId: string;
    passwordResetId: string;
    senhaHash: string;
  }) {
    return this.prisma.$transaction([
      this.prisma.aluno.update({
        where: { id: params.alunoId },
        data: { senhaHash: params.senhaHash },
      }),
      this.prisma.recuperacaoSenha.update({
        where: { id: params.passwordResetId },
        data: { usadoEm: new Date() },
      }),
    ]);
  }

  isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
