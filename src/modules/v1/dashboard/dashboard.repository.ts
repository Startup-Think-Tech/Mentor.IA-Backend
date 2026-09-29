import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DashboardFilters = {
  alunoId: string;
  disciplinaId?: string;
  inicio?: Date;
  fim?: Date;
};

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getResumo(filters: DashboardFilters) {
    const desempenhoWhere: Prisma.RegistroDesempenhoWhereInput = {
      alunoId: filters.alunoId,
      ...(filters.disciplinaId && { disciplinaId: filters.disciplinaId }),
      ...(this.dateFilter(
        'registradoEm',
        filters,
      ) as Prisma.RegistroDesempenhoWhereInput),
    };

    const gapsWhere: Prisma.GapWhereInput = {
      alunoId: filters.alunoId,
      ...(filters.disciplinaId && { disciplinaId: filters.disciplinaId }),
      ...(this.dateFilter('calculadoEm', filters) as Prisma.GapWhereInput),
    };

    const sessoesWhere: Prisma.SessaoEstudoWhereInput = {
      alunoId: filters.alunoId,
      ...(filters.disciplinaId && { disciplinaId: filters.disciplinaId }),
      ...(this.dateFilter(
        'agendadoPara',
        filters,
      ) as Prisma.SessaoEstudoWhereInput),
    };

    const revisoesWhere: Prisma.RevisaoWhereInput = {
      alunoId: filters.alunoId,
      ...(filters.disciplinaId && { disciplinaId: filters.disciplinaId }),
      ...(this.dateFilter('criadoEm', filters) as Prisma.RevisaoWhereInput),
    };

    const [
      desempenho,
      gapsPorPrioridade,
      sessoesPorStatus,
      revisoesPorStatus,
      cronogramaAtual,
    ] = await Promise.all([
      this.prisma.registroDesempenho.aggregate({
        where: desempenhoWhere,
        _avg: { percentual: true },
        _count: { _all: true },
      }),
      this.prisma.gap.groupBy({
        by: ['nivelPrioridade'],
        where: gapsWhere,
        _count: { _all: true },
      }),
      this.prisma.sessaoEstudo.groupBy({
        by: ['status'],
        where: sessoesWhere,
        _count: { _all: true },
      }),
      this.prisma.revisao.groupBy({
        by: ['status'],
        where: revisoesWhere,
        _count: { _all: true },
      }),
      this.prisma.cronograma.findFirst({
        where: {
          alunoId: filters.alunoId,
          status: 'ATIVO',
        },
        orderBy: { geradoEm: 'desc' },
        select: {
          id: true,
          status: true,
          validoAPartir: true,
          validoAte: true,
          geradoEm: true,
        },
      }),
    ]);

    return {
      desempenho: {
        percentual_medio: desempenho._avg.percentual,
        total_registros: desempenho._count._all,
      },
      gaps_por_prioridade: gapsPorPrioridade.map((item) => ({
        nivel: item.nivelPrioridade,
        total: item._count._all,
      })),
      sessoes_por_status: sessoesPorStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
      revisoes_por_status: revisoesPorStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
      cronograma_atual: cronogramaAtual,
    };
  }

  async getHistorico(
    filters: DashboardFilters,
    pagina: number,
    limite: number,
  ) {
    const where: Prisma.RegistroDesempenhoWhereInput = {
      alunoId: filters.alunoId,
      ...(filters.disciplinaId && { disciplinaId: filters.disciplinaId }),
      ...(this.dateFilter(
        'registradoEm',
        filters,
      ) as Prisma.RegistroDesempenhoWhereInput),
    };

    const [itens, total] = await Promise.all([
      this.prisma.registroDesempenho.findMany({
        where,
        orderBy: { registradoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
        include: {
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
        },
      }),
      this.prisma.registroDesempenho.count({ where }),
    ]);

    return {
      itens,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }

  private dateFilter(
    field: 'registradoEm' | 'calculadoEm' | 'agendadoPara' | 'criadoEm',
    filters: DashboardFilters,
  ) {
    if (!filters.inicio && !filters.fim) {
      return {};
    }

    return {
      [field]: {
        ...(filters.inicio && { gte: filters.inicio }),
        ...(filters.fim && { lte: filters.fim }),
      },
    };
  }
}
