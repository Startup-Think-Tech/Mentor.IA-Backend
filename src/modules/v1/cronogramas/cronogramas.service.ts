import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CronogramasRepository } from './cronogramas.repository';
import { GerarCronogramaDto } from './dto/gerar-cronograma.dto';

@Injectable()
export class CronogramasService {
  constructor(private readonly repository: CronogramasRepository) {}

  async gerar(alunoId: string, dto: GerarCronogramaDto) {
    return this.criar(alunoId, dto, false);
  }

  async recalcular(alunoId: string, dto: GerarCronogramaDto) {
    return this.criar(alunoId, dto, true);
  }

  async atual(alunoId: string) {
    const cronograma = await this.repository.findCurrent(alunoId);
    if (!cronograma)
      throw new NotFoundException('Cronograma ativo não encontrado.');
    return this.toResponse(cronograma);
  }

  async historico(alunoId: string) {
    const cronogramas = await this.repository.findHistory(alunoId);
    return cronogramas.map((cronograma) => this.toResponse(cronograma));
  }

  async porId(alunoId: string, id: string) {
    const cronograma = await this.repository.findOne(alunoId, id);
    if (!cronograma) throw new NotFoundException('Cronograma não encontrado.');
    return this.toResponse(cronograma);
  }

  private async criar(
    alunoId: string,
    dto: GerarCronogramaDto,
    recalcular: boolean,
  ) {
    const inicio = this.dataInicio(dto.dataInicio);
    const result = await this.repository.createSchedule({
      alunoId,
      dataInicio: inicio,
      dias: dto.dias ?? 14,
      recalcular,
    });

    switch (result.kind) {
      case 'not_found':
        throw new NotFoundException('Aluno não encontrado.');
      case 'already_active':
        throw new ConflictException(
          'Já existe um cronograma ativo. Use POST /cronogramas/recalcular.',
        );
      case 'no_active':
        throw new ConflictException(
          'Não existe cronograma ativo. Use POST /cronogramas/gerar.',
        );
      case 'no_availability':
        throw new ConflictException(
          'Informe disponibilidade semanal com pelo menos um bloco de 30 minutos.',
        );
      case 'no_plan':
        throw new ConflictException(
          'Não há gaps com prioridade positiva nem revisões para planejar.',
        );
      case 'ok':
        return this.toResponse(result.cronograma);
    }
  }

  private dataInicio(data?: string): Date {
    const agora = new Date();
    const amanha = new Date(
      Date.UTC(
        agora.getUTCFullYear(),
        agora.getUTCMonth(),
        agora.getUTCDate() + 1,
        12,
      ),
    );
    if (!data) return amanha;

    const inicio = new Date(data + 'T12:00:00.000Z');
    if (
      Number.isNaN(inicio.getTime()) ||
      inicio.toISOString().slice(0, 10) !== data
    ) {
      throw new BadRequestException(
        'dataInicio deve ser uma data válida no formato YYYY-MM-DD.',
      );
    }
    if (inicio.getTime() < amanha.getTime()) {
      throw new BadRequestException(
        'dataInicio não pode ser anterior a amanhã (UTC).',
      );
    }
    return inicio;
  }

  private toResponse(
    cronograma: NonNullable<
      Awaited<ReturnType<CronogramasRepository['findOne']>>
    >,
  ) {
    return {
      id: cronograma.id,
      status: cronograma.status,
      validoAPartir: cronograma.validoAPartir,
      validoAte: cronograma.validoAte,
      geradoEm: cronograma.geradoEm,
      totalSessoes: cronograma.sessoesEstudo.length,
      sessoes: cronograma.sessoesEstudo.map((sessao) => ({
        id: sessao.id,
        tipo: sessao.tipo,
        status: sessao.status,
        agendadoPara: sessao.agendadoPara,
        duracaoMinutos: sessao.duracaoMinutos,
        disciplina: sessao.disciplina,
        conteudo: sessao.conteudo,
        revisaoId: sessao.revisaoId,
      })),
    };
  }
}
