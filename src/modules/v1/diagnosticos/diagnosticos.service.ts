import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { selectDiagnosticoQuestionReferences } from './useCases/diagnostico-reference-pool';
import { getEnemDisciplineByQuestionIndex } from './useCases/enem-discipline';
import type { AtualizarRespostaDiagnosticoDto } from './dto/atualizar-resposta-diagnostico.dto';
import type { RegistrarRespostasDiagnosticoDto } from './dto/registrar-respostas-diagnostico.dto';
import {
  DiagnosticoQuestaoRecord,
  DiagnosticoRecord,
  DiagnosticosRepository,
} from './diagnosticos.repository';
import type { DesempenhoRecord } from './desempenhos/desempenhos.repository';

@Injectable()
export class DiagnosticosService {
  constructor(
    private readonly diagnosticosRepository: DiagnosticosRepository,
  ) {}

  async create(alunoId: string) {
    const references = selectDiagnosticoQuestionReferences();
    const result = await this.diagnosticosRepository.createAlunoDiagnostico(
      alunoId,
      references,
    );

    if (!result.created) {
      throw new ConflictException(
        'Já existe um diagnóstico em andamento para este aluno.',
      );
    }

    return this.toResponse(result.diagnostico);
  }

  async findCurrent(alunoId: string) {
    const diagnostico =
      await this.diagnosticosRepository.findAlunoDiagnosticoAtual(alunoId);

    if (!diagnostico) {
      throw new NotFoundException('Diagnóstico em andamento não encontrado.');
    }

    return this.toResponse(diagnostico);
  }

  async findHistory(alunoId: string) {
    const diagnosticos =
      await this.diagnosticosRepository.findAlunoDiagnosticoHistory(alunoId);

    return diagnosticos.map((diagnostico) => this.toResponse(diagnostico));
  }

  async findOne(alunoId: string, id: string) {
    const diagnostico =
      await this.diagnosticosRepository.findAlunoDiagnosticoById(alunoId, id);

    if (!diagnostico) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    return this.toResponse(diagnostico);
  }

  async findQuestions(alunoId: string, diagnosticoId: string) {
    const diagnostico =
      await this.diagnosticosRepository.findAlunoDiagnosticoById(
        alunoId,
        diagnosticoId,
      );

    if (!diagnostico) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    const questoes =
      await this.diagnosticosRepository.findDiagnosticoQuestions(diagnosticoId);

    return questoes.map((questao) => this.toQuestionResponse(questao));
  }

  async registerResponses(
    alunoId: string,
    diagnosticoId: string,
    dto: RegistrarRespostasDiagnosticoDto,
  ) {
    const questionIds = dto.respostas.map(
      (resposta) => resposta.diagnosticoQuestaoId,
    );
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException(
        'A mesma questão não pode aparecer mais de uma vez na solicitação.',
      );
    }

    const result =
      await this.diagnosticosRepository.registerAlunoDiagnosticoResponses(
        alunoId,
        diagnosticoId,
        dto.respostas.map((resposta) => ({
          diagnosticoQuestaoId: resposta.diagnosticoQuestaoId,
          alternativaMarcada: this.normalizeAlternative(
            resposta.alternativaMarcada,
          ),
          acertoInformado: resposta.acertoInformado,
        })),
      );

    if (result.kind !== 'ok') {
      this.handleResponseMutationError(result.kind);
      throw new Error('Estado inesperado ao registrar respostas.');
    }

    return this.toProgressResponse(
      diagnosticoId,
      result.status,
      result.questoes,
    );
  }

  async updateResponse(
    alunoId: string,
    diagnosticoId: string,
    respostaId: string,
    dto: AtualizarRespostaDiagnosticoDto,
  ) {
    const result =
      await this.diagnosticosRepository.updateAlunoDiagnosticoResponse(
        alunoId,
        diagnosticoId,
        respostaId,
        {
          alternativaMarcada: this.normalizeAlternative(dto.alternativaMarcada),
          acertoInformado: dto.acertoInformado,
        },
      );

    if (result.kind !== 'ok') {
      this.handleResponseMutationError(result.kind);
      throw new Error('Estado inesperado ao atualizar resposta.');
    }

    return this.toProgressResponse(
      diagnosticoId,
      result.status,
      result.questoes,
    );
  }

  async finalize(alunoId: string, diagnosticoId: string) {
    const result = await this.diagnosticosRepository.finalizeAlunoDiagnostico(
      alunoId,
      diagnosticoId,
    );

    if (result.kind === 'not_found') {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }
    if (result.kind === 'cancelled') {
      throw new ConflictException(
        'Diagnóstico cancelado não pode ser finalizado.',
      );
    }
    if (result.kind === 'empty') {
      throw new ConflictException('O diagnóstico não possui questões.');
    }
    if (result.kind === 'incomplete') {
      throw new ConflictException(
        'Todas as questões precisam estar respondidas e corrigidas antes da finalização.',
      );
    }

    return this.toResultResponse(
      diagnosticoId,
      result.finalizadoEm,
      result.totalQuestoes,
      result.desempenhos,
    );
  }

  async findResult(alunoId: string, diagnosticoId: string) {
    const result = await this.diagnosticosRepository.findAlunoDiagnosticoResult(
      alunoId,
      diagnosticoId,
    );

    if (!result) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    if (!result.diagnostico.finalizadoEm) {
      throw new ConflictException('O diagnóstico ainda não foi finalizado.');
    }

    return this.toResultResponse(
      diagnosticoId,
      result.diagnostico.finalizadoEm,
      result.diagnostico._count.questoes,
      result.desempenhos,
    );
  }

  private toResponse(diagnostico: DiagnosticoRecord) {
    return {
      id: diagnostico.id,
      status: diagnostico.status,
      totalQuestoes: diagnostico._count.questoes,
      criadoEm: diagnostico.criadoEm,
      finalizadoEm: diagnostico.finalizadoEm,
    };
  }

  private normalizeAlternative(alternativa: string) {
    return alternativa.trim().toUpperCase();
  }

  private handleResponseMutationError(kind: string) {
    if (kind === 'not_found') {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }
    if (kind === 'closed') {
      throw new ConflictException(
        'Respostas só podem ser alteradas enquanto o diagnóstico estiver em andamento.',
      );
    }
    if (kind === 'invalid_question') {
      throw new BadRequestException(
        'Uma ou mais questões não pertencem ao diagnóstico informado.',
      );
    }
    if (kind === 'duplicate') {
      throw new ConflictException(
        'Uma ou mais questões já possuem resposta registrada. Use PATCH para editar.',
      );
    }
    if (kind === 'response_not_found') {
      throw new NotFoundException('Resposta não encontrada neste diagnóstico.');
    }
  }

  private toProgressResponse(
    diagnosticoId: string,
    status: import('@prisma/client').DiagnosticoStatus,
    questoes: {
      id: string;
      resposta:
        import('./diagnosticos.repository').RespostaDiagnosticoRecord | null;
    }[],
  ) {
    const respondidas = questoes.filter((questao) => questao.resposta !== null);
    const proxima = questoes.find((questao) => questao.resposta === null);

    return {
      diagnosticoId,
      status,
      totalQuestoes: questoes.length,
      respondidas: respondidas.length,
      restantes: questoes.length - respondidas.length,
      completo: respondidas.length === questoes.length,
      proximaQuestaoId: proxima?.id ?? null,
      respostas: respondidas.map((questao) => questao.resposta),
    };
  }

  private toResultResponse(
    diagnosticoId: string,
    finalizadoEm: Date,
    totalQuestoes: number,
    desempenhos: DesempenhoRecord[],
  ) {
    const totalAcertos = desempenhos.reduce(
      (total, desempenho) => total + desempenho.acertos,
      0,
    );

    const totalConsiderado = desempenhos.reduce(
      (total, desempenho) => total + desempenho.totalQuestoes,
      0,
    );

    return {
      diagnosticoId,
      status: 'FINALIZADO' as const,
      totalQuestoes,
      totalAcertos,
      percentualGeral:
        totalConsiderado === 0
          ? 0
          : Number(((totalAcertos / totalConsiderado) * 100).toFixed(2)),
      finalizadoEm,
      desempenhos: desempenhos.map((registro) => ({
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
      })),
    };
  }

  private toQuestionResponse(questao: DiagnosticoQuestaoRecord) {
    return {
      id: questao.id,
      year: questao.questionYear,
      index: questao.questionIndex,
      language: questao.language,
      discipline: getEnemDisciplineByQuestionIndex(questao.questionIndex),
      ordem: questao.ordem,
      disciplinaId: questao.disciplinaId,
      conteudoId: questao.conteudoId,
    };
  }
}
