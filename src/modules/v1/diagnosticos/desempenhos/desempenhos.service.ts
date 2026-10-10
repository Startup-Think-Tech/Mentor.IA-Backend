import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiagnosticoStatus, Prisma } from '@prisma/client';
import {
  DesempenhoRecord,
  DesempenhosRepository,
  DiagnosticoParaDesempenho,
  NovoDesempenhoDiagnostico,
} from './desempenhos.repository';

@Injectable()
export class DesempenhosService {
  constructor(private readonly desempenhosRepository: DesempenhosRepository) {}

  async findCurrent(alunoId: string, diagnosticoId?: string) {
    const historico = await this.desempenhosRepository.findAlunoHistory(
      alunoId,
      diagnosticoId,
    );

    return this.latestByContent(historico).map((registro) =>
      this.toResponse(registro),
    );
  }

  async findHistory(alunoId: string, diagnosticoId?: string) {
    const historico = await this.desempenhosRepository.findAlunoHistory(
      alunoId,
      diagnosticoId,
    );

    return historico.map((registro) => this.toResponse(registro));
  }

  async findByDiscipline(
    alunoId: string,
    disciplinaId: string,
    diagnosticoId?: string,
  ) {
    const historico =
      await this.desempenhosRepository.findAlunoDisciplineHistory(
        alunoId,
        disciplinaId,
        diagnosticoId,
      );

    return this.latestByContent(historico).map((registro) =>
      this.toResponse(registro),
    );
  }

  async consolidateDiagnosticPerformance(
    alunoId: string,
    diagnosticoId: string,
  ) {
    const diagnostico =
      await this.desempenhosRepository.findAlunoDiagnosticoForPerformance(
        alunoId,
        diagnosticoId,
      );

    if (!diagnostico) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    if (diagnostico.status !== DiagnosticoStatus.FINALIZADO) {
      throw new ConflictException(
        'O desempenho só pode ser consolidado após a finalização do diagnóstico.',
      );
    }

    const registros = this.buildDiagnosticPerformance(diagnostico);
    const persisted =
      await this.desempenhosRepository.persistDiagnosticPerformanceIdempotently(
        alunoId,
        diagnosticoId,
        registros,
      );

    return persisted.map((registro) => this.toResponse(registro));
  }

  private buildDiagnosticPerformance(
    diagnostico: DiagnosticoParaDesempenho,
  ): NovoDesempenhoDiagnostico[] {
    if (diagnostico.questoes.length === 0) {
      throw new ConflictException('O diagnóstico não possui questões.');
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
      if (!questao.disciplinaId || !questao.conteudoId) {
        throw new ConflictException(
          'As questões do diagnóstico precisam de disciplina e conteúdo para consolidar desempenho.',
        );
      }

      if (!questao.resposta || questao.resposta.acertoInformado === null) {
        throw new ConflictException(
          'Todas as questões precisam possuir resposta corrigida antes de consolidar desempenho.',
        );
      }

      const key = `${questao.disciplinaId}:${questao.conteudoId}`;
      const group = groups.get(key) ?? {
        disciplinaId: questao.disciplinaId,
        conteudoId: questao.conteudoId,
        totalQuestoes: 0,
        acertos: 0,
        correcaoVerificada: true,
      };

      group.totalQuestoes += 1;
      group.acertos += questao.resposta.acertoInformado ? 1 : 0;
      group.correcaoVerificada =
        group.correcaoVerificada && questao.resposta.correcaoVerificada;
      groups.set(key, group);
    }

    return [...groups.values()].map((group) => ({
      ...group,
      percentual: new Prisma.Decimal(
        ((group.acertos / group.totalQuestoes) * 100).toFixed(2),
      ),
    }));
  }

  private latestByContent(registros: DesempenhoRecord[]) {
    const latest = new Set<string>();

    return registros.filter((registro) => {
      const key = `${registro.disciplinaId}:${registro.conteudoId}`;
      if (latest.has(key)) {
        return false;
      }

      latest.add(key);
      return true;
    });
  }

  private toResponse(registro: DesempenhoRecord) {
    return {
      id: registro.id,
      diagnosticoId: registro.diagnosticoId,
      disciplina: registro.disciplina,
      conteudo: registro.conteudo,
      tipoOrigem: registro.tipoOrigem,
      totalQuestoes: registro.totalQuestoes,
      acertos: registro.acertos,
      percentual: registro.percentual.toNumber(),
      correcaoVerificada: registro.correcaoVerificada,
      registradoEm: registro.registradoEm,
    };
  }
}
