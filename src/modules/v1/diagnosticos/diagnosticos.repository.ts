import { Injectable } from '@nestjs/common';
import {
  DiagnosticoStatus,
  Prisma,
  TipoOrigemDesempenho,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calcularGap } from '../gaps/useCases/gap-calculator';
import type { DiagnosticoQuestionReference } from './useCases/diagnostico-reference-pool';
import {
  ENEM_DISCIPLINE_METADATA,
  getEnemDisciplineByQuestionIndex,
} from './useCases/enem-discipline';

const diagnosticoSelect = {
  id: true,
  status: true,
  criadoEm: true,
  finalizadoEm: true,
  _count: {
    select: { questoes: true },
  },
} satisfies Prisma.DiagnosticoSelect;

const respostaSelect = {
  id: true,
  diagnosticoQuestaoId: true,
  alternativaMarcada: true,
  acertoInformado: true,
  correcaoVerificada: true,
  respondidoEm: true,
  atualizadoEm: true,
} satisfies Prisma.RespostaDiagnosticoSelect;

const questaoSelect = {
  id: true,
  questionYear: true,
  questionIndex: true,
  language: true,
  ordem: true,
  disciplinaId: true,
  conteudoId: true,
} satisfies Prisma.DiagnosticoQuestaoSelect;

export type DiagnosticoRecord = Prisma.DiagnosticoGetPayload<{
  select: typeof diagnosticoSelect;
}>;

export type DiagnosticoQuestaoRecord = Prisma.DiagnosticoQuestaoGetPayload<{
  select: typeof questaoSelect;
}>;

export type RespostaDiagnosticoRecord = Prisma.RespostaDiagnosticoGetPayload<{
  select: typeof respostaSelect;
}>;

export type RegistrarRespostaInput = {
  diagnosticoQuestaoId: string;
  alternativaMarcada: string;
  acertoInformado: boolean;
};

@Injectable()
export class DiagnosticosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAlunoDiagnostico(
    alunoId: string,
    references: DiagnosticoQuestionReference[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      // Serializa a criação por aluno sem criar catálogo/tabela auxiliar.
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${alunoId}, 0))
      `;

      const atual = await transaction.diagnostico.findFirst({
        where: {
          alunoId,
          status: DiagnosticoStatus.EM_ANDAMENTO,
        },
        select: diagnosticoSelect,
      });

      if (atual) {
        return { diagnostico: atual, created: false as const };
      }

      const diagnostico = await transaction.diagnostico.create({
        data: {
          alunoId,
          questoes: {
            create: references.map((reference, index) => ({
              questionYear: reference.questionYear,
              questionIndex: reference.questionIndex,
              language: reference.language,
              ordem: index + 1,
            })),
          },
        },
        select: diagnosticoSelect,
      });

      return { diagnostico, created: true as const };
    });
  }

  findAlunoDiagnosticoAtual(alunoId: string) {
    return this.prisma.diagnostico.findFirst({
      where: {
        alunoId,
        status: DiagnosticoStatus.EM_ANDAMENTO,
      },
      orderBy: { criadoEm: 'desc' },
      select: diagnosticoSelect,
    });
  }

  findAlunoDiagnosticoHistory(alunoId: string) {
    return this.prisma.diagnostico.findMany({
      where: {
        alunoId,
        status: {
          in: [DiagnosticoStatus.FINALIZADO, DiagnosticoStatus.CANCELADO],
        },
      },
      orderBy: { criadoEm: 'desc' },
      select: diagnosticoSelect,
    });
  }

  findAlunoDiagnosticoById(alunoId: string, id: string) {
    return this.prisma.diagnostico.findFirst({
      where: { id, alunoId },
      select: diagnosticoSelect,
    });
  }

  async registerAlunoDiagnosticoResponses(
    alunoId: string,
    diagnosticoId: string,
    respostas: RegistrarRespostaInput[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${diagnosticoId}, 0))
      `;

      const diagnostico = await transaction.diagnostico.findFirst({
        where: { id: diagnosticoId, alunoId },
        select: {
          id: true,
          status: true,
          questoes: {
            orderBy: { ordem: 'asc' },
            select: {
              id: true,
              resposta: { select: { id: true } },
            },
          },
        },
      });

      if (!diagnostico) {
        return { kind: 'not_found' as const };
      }

      if (diagnostico.status !== DiagnosticoStatus.EM_ANDAMENTO) {
        return { kind: 'closed' as const };
      }

      const questaoIds = new Set(
        diagnostico.questoes.map((questao) => questao.id),
      );
      if (
        respostas.some(
          (resposta) => !questaoIds.has(resposta.diagnosticoQuestaoId),
        )
      ) {
        return { kind: 'invalid_question' as const };
      }

      const jaRespondidas = new Set(
        diagnostico.questoes
          .filter((questao) => questao.resposta !== null)
          .map((questao) => questao.id),
      );
      if (
        respostas.some((resposta) =>
          jaRespondidas.has(resposta.diagnosticoQuestaoId),
        )
      ) {
        return { kind: 'duplicate' as const };
      }

      for (const resposta of respostas) {
        await transaction.respostaDiagnostico.create({
          data: {
            diagnosticoQuestaoId: resposta.diagnosticoQuestaoId,
            alternativaMarcada: resposta.alternativaMarcada,
            acertoInformado: resposta.acertoInformado,
            correcaoVerificada: true,
          },
        });
      }

      const questoesAtualizadas = await transaction.diagnosticoQuestao.findMany(
        {
          where: { diagnosticoId },
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            resposta: { select: respostaSelect },
          },
        },
      );

      return {
        kind: 'ok' as const,
        status: diagnostico.status,
        questoes: questoesAtualizadas,
      };
    });
  }

  async updateAlunoDiagnosticoResponse(
    alunoId: string,
    diagnosticoId: string,
    respostaId: string,
    data: { alternativaMarcada: string; acertoInformado: boolean },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${diagnosticoId}, 0))
      `;

      const diagnostico = await transaction.diagnostico.findFirst({
        where: { id: diagnosticoId, alunoId },
        select: { id: true, status: true },
      });

      if (!diagnostico) {
        return { kind: 'not_found' as const };
      }

      if (diagnostico.status !== DiagnosticoStatus.EM_ANDAMENTO) {
        return { kind: 'closed' as const };
      }

      const resposta = await transaction.respostaDiagnostico.findFirst({
        where: {
          id: respostaId,
          diagnosticoQuestao: { diagnosticoId },
        },
        select: { id: true },
      });

      if (!resposta) {
        return { kind: 'response_not_found' as const };
      }

      await transaction.respostaDiagnostico.update({
        where: { id: respostaId },
        data: {
          alternativaMarcada: data.alternativaMarcada,
          acertoInformado: data.acertoInformado,
          correcaoVerificada: true,
        },
      });

      const questoesAtualizadas = await transaction.diagnosticoQuestao.findMany(
        {
          where: { diagnosticoId },
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            resposta: { select: respostaSelect },
          },
        },
      );

      return {
        kind: 'ok' as const,
        status: diagnostico.status,
        questoes: questoesAtualizadas,
      };
    });
  }

  async finalizeAlunoDiagnostico(alunoId: string, diagnosticoId: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${diagnosticoId}, 0))
      `;

      const diagnostico = await transaction.diagnostico.findFirst({
        where: { id: diagnosticoId, alunoId },
        select: {
          id: true,
          status: true,
          finalizadoEm: true,
          questoes: {
            orderBy: { ordem: 'asc' },
            select: {
              id: true,
              questionIndex: true,
              resposta: {
                select: {
                  acertoInformado: true,
                  correcaoVerificada: true,
                },
              },
            },
          },
        },
      });

      if (!diagnostico) {
        return { kind: 'not_found' as const };
      }

      if (diagnostico.status === DiagnosticoStatus.CANCELADO) {
        return { kind: 'cancelled' as const };
      }

      if (diagnostico.status === DiagnosticoStatus.FINALIZADO) {
        const desempenhos = await transaction.registroDesempenho.findMany({
          where: {
            alunoId,
            diagnosticoId,
            tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
          },
          orderBy: { registradoEm: 'asc' },
          include: {
            disciplina: { select: { id: true, nome: true, codigo: true } },
            conteudo: { select: { id: true, nome: true } },
          },
        });

        return {
          kind: 'already_finalized' as const,
          finalizadoEm: diagnostico.finalizadoEm!,
          totalQuestoes: diagnostico.questoes.length,
          desempenhos,
        };
      }

      if (diagnostico.questoes.length === 0) {
        return { kind: 'empty' as const };
      }

      const incompleta = diagnostico.questoes.some(
        (questao) =>
          !questao.resposta || questao.resposta.acertoInformado === null,
      );
      if (incompleta) {
        return { kind: 'incomplete' as const };
      }

      const metadataByArea = new Map<
        string,
        { disciplinaId: string; conteudoId: string }
      >();

      for (const questao of diagnostico.questoes) {
        const area = getEnemDisciplineByQuestionIndex(questao.questionIndex);
        if (!metadataByArea.has(area)) {
          const metadata = ENEM_DISCIPLINE_METADATA[area];
          const disciplina = await transaction.disciplina.upsert({
            where: { codigo: metadata.codigo },
            update: { nome: metadata.nome, ativo: true },
            create: {
              nome: metadata.nome,
              codigo: metadata.codigo,
              ativo: true,
            },
            select: { id: true },
          });

          const conteudo = await transaction.conteudo.upsert({
            where: {
              disciplinaId_nome: {
                disciplinaId: disciplina.id,
                nome: 'Geral',
              },
            },
            update: { ativo: true },
            create: {
              disciplinaId: disciplina.id,
              nome: 'Geral',
              ativo: true,
            },
            select: { id: true },
          });

          metadataByArea.set(area, {
            disciplinaId: disciplina.id,
            conteudoId: conteudo.id,
          });
        }
      }

      const groups = new Map<
        string,
        {
          disciplinaId: string;
          conteudoId: string;
          totalQuestoes: number;
          acertos: number;
          correcaoVerificada: boolean;
        }
      >();

      for (const questao of diagnostico.questoes) {
        const area = getEnemDisciplineByQuestionIndex(questao.questionIndex);
        const metadata = metadataByArea.get(area)!;

        await transaction.diagnosticoQuestao.update({
          where: { id: questao.id },
          data: {
            disciplinaId: metadata.disciplinaId,
            conteudoId: metadata.conteudoId,
          },
        });

        const key = `${metadata.disciplinaId}:${metadata.conteudoId}`;
        const group = groups.get(key) ?? {
          ...metadata,
          totalQuestoes: 0,
          acertos: 0,
          correcaoVerificada: true,
        };

        group.totalQuestoes += 1;
        group.acertos += questao.resposta!.acertoInformado ? 1 : 0;
        group.correcaoVerificada =
          group.correcaoVerificada && questao.resposta!.correcaoVerificada;
        groups.set(key, group);
      }

      const gruposComCalculo = [...groups.values()].map((group) => ({
        group,
        calculo: calcularGap((group.acertos / group.totalQuestoes) * 100),
      }));

      // Desempenhos e gaps devem ser persistidos juntos, antes de finalizar.
      // O lock e o status FINALIZADO tornam uma segunda finalizacao idempotente.
      await transaction.registroDesempenho.createMany({
        data: gruposComCalculo.map(({ group, calculo }) => ({
          alunoId,
          diagnosticoId,
          disciplinaId: group.disciplinaId,
          conteudoId: group.conteudoId,
          tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
          totalQuestoes: group.totalQuestoes,
          acertos: group.acertos,
          percentual: new Prisma.Decimal(calculo.desempenho),
          correcaoVerificada: group.correcaoVerificada,
        })),
      });

      await transaction.gap.createMany({
        data: gruposComCalculo.map(({ group, calculo }) => ({
          alunoId,
          disciplinaId: group.disciplinaId,
          conteudoId: group.conteudoId,
          desempenho: new Prisma.Decimal(calculo.desempenho),
          pontuacaoGap: new Prisma.Decimal(calculo.pontuacaoGap),
          pontuacaoUrgencia: new Prisma.Decimal(calculo.pontuacaoUrgencia),
          pontuacaoPrioridade: new Prisma.Decimal(calculo.pontuacaoPrioridade),
          nivelPrioridade: calculo.nivelPrioridade,
        })),
      });

      const finalizadoEm = new Date();
      await transaction.diagnostico.update({
        where: { id: diagnosticoId },
        data: {
          status: DiagnosticoStatus.FINALIZADO,
          finalizadoEm,
        },
      });

      const desempenhos = await transaction.registroDesempenho.findMany({
        where: {
          alunoId,
          diagnosticoId,
          tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
        },
        orderBy: { registradoEm: 'asc' },
        include: {
          disciplina: { select: { id: true, nome: true, codigo: true } },
          conteudo: { select: { id: true, nome: true } },
        },
      });

      return {
        kind: 'ok' as const,
        finalizadoEm,
        totalQuestoes: diagnostico.questoes.length,
        desempenhos,
      };
    });
  }

  async findAlunoDiagnosticoResult(alunoId: string, diagnosticoId: string) {
    const diagnostico = await this.prisma.diagnostico.findFirst({
      where: { id: diagnosticoId, alunoId },
      select: {
        id: true,
        status: true,
        finalizadoEm: true,
        _count: { select: { questoes: true } },
      },
    });

    if (!diagnostico) {
      return null;
    }

    const desempenhos = await this.prisma.registroDesempenho.findMany({
      where: {
        alunoId,
        diagnosticoId,
        tipoOrigem: TipoOrigemDesempenho.DIAGNOSTICO,
      },
      orderBy: { registradoEm: 'asc' },
      include: {
        disciplina: { select: { id: true, nome: true, codigo: true } },
        conteudo: { select: { id: true, nome: true } },
      },
    });

    return { diagnostico, desempenhos };
  }

  findDiagnosticoQuestions(diagnosticoId: string) {
    return this.prisma.diagnosticoQuestao.findMany({
      where: { diagnosticoId },
      orderBy: { ordem: 'asc' },
      select: questaoSelect,
    });
  }

  findPendingDiagnosticoQuestions(diagnosticoId: string) {
    return this.prisma.diagnosticoQuestao.findMany({
      where: { diagnosticoId, resposta: null },
      orderBy: { ordem: 'asc' },
      select: questaoSelect,
    });
  }

  findAlunoDiagnosticoQuestionByResponseId(
    alunoId: string,
    diagnosticoId: string,
    respostaId: string,
  ) {
    return this.prisma.diagnosticoQuestao.findFirst({
      where: {
        diagnosticoId,
        diagnostico: { alunoId },
        resposta: { is: { id: respostaId } },
      },
      select: questaoSelect,
    });
  }
}
