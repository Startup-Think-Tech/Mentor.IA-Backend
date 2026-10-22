/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await -- Jest transaction mocks use dynamic Prisma-shaped payloads. */
import { DiagnosticoStatus, NivelPrioridade } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosticosRepository } from './diagnosticos.repository';

const ALUNO_ID = '11111111-1111-4111-8111-111111111111';
const DIAGNOSTICO_ID = '22222222-2222-4222-8222-222222222222';
const LINGUAGENS_ID = '33333333-3333-4333-8333-333333333333';
const MATEMATICA_ID = '44444444-4444-4444-8444-444444444444';
const CONTEUDO_LINGUAGENS_ID = '55555555-5555-4555-8555-555555555555';
const CONTEUDO_MATEMATICA_ID = '66666666-6666-4666-8666-666666666666';

describe('DiagnosticosRepository - finalizacao e persistencia de gaps', () => {
  let finalizado: boolean;
  let registrosDesempenho: Record<string, unknown>[];
  const $executeRaw = jest.fn();
  const diagnosticoFindFirst = jest.fn();
  const diagnosticoUpdate = jest.fn();
  const registroCreateMany = jest.fn();
  const registroFindMany = jest.fn();
  const gapCreateMany = jest.fn();
  const questaoUpdate = jest.fn();
  const disciplinaUpsert = jest.fn();
  const conteudoUpsert = jest.fn();

  const transaction = {
    $executeRaw,
    diagnostico: { findFirst: diagnosticoFindFirst, update: diagnosticoUpdate },
    disciplina: { upsert: disciplinaUpsert },
    conteudo: { upsert: conteudoUpsert },
    diagnosticoQuestao: { update: questaoUpdate },
    registroDesempenho: {
      createMany: registroCreateMany,
      findMany: registroFindMany,
    },
    gap: { createMany: gapCreateMany },
  };

  const prisma = {
    $transaction: jest.fn(async (fn: (tx: typeof transaction) => unknown) =>
      fn(transaction),
    ),
  } as unknown as PrismaService;

  const repository = new DiagnosticosRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    finalizado = false;
    registrosDesempenho = [];

    $executeRaw.mockResolvedValue(0);
    diagnosticoFindFirst.mockImplementation(() => ({
      id: DIAGNOSTICO_ID,
      status: finalizado
        ? DiagnosticoStatus.FINALIZADO
        : DiagnosticoStatus.EM_ANDAMENTO,
      finalizadoEm: finalizado ? new Date('2026-10-16T12:00:00Z') : null,
      questoes: [
        {
          id: 'q1',
          questionIndex: 1,
          resposta: { acertoInformado: false, correcaoVerificada: false },
        },
        {
          id: 'q2',
          questionIndex: 2,
          resposta: { acertoInformado: true, correcaoVerificada: false },
        },
        {
          id: 'q3',
          questionIndex: 136,
          resposta: { acertoInformado: false, correcaoVerificada: true },
        },
      ],
    }));
    disciplinaUpsert.mockImplementation(({ where }) => ({
      id: where.codigo === 'linguagens' ? LINGUAGENS_ID : MATEMATICA_ID,
    }));
    conteudoUpsert.mockImplementation(({ where }) => ({
      id:
        where.disciplinaId_nome.disciplinaId === LINGUAGENS_ID
          ? CONTEUDO_LINGUAGENS_ID
          : CONTEUDO_MATEMATICA_ID,
    }));
    questaoUpdate.mockResolvedValue({});
    registroCreateMany.mockImplementation(({ data }) => {
      registrosDesempenho.push(...data);
      return { count: data.length };
    });
    gapCreateMany.mockImplementation(({ data }) => ({ count: data.length }));
    diagnosticoUpdate.mockImplementation(() => {
      finalizado = true;
      return {};
    });
    registroFindMany.mockImplementation(() => registrosDesempenho);
  });

  it('grava desempenho e gaps por area na mesma transacao', async () => {
    const resultado = await repository.finalizeAlunoDiagnostico(
      ALUNO_ID,
      DIAGNOSTICO_ID,
    );

    expect(resultado.kind).toBe('ok');
    expect(registroCreateMany).toHaveBeenCalledTimes(1);
    expect(gapCreateMany).toHaveBeenCalledTimes(1);
    expect(diagnosticoUpdate).toHaveBeenCalledTimes(1);

    const gaps = gapCreateMany.mock.calls[0][0].data;
    expect(gaps).toHaveLength(2);
    expect(gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alunoId: ALUNO_ID,
          disciplinaId: LINGUAGENS_ID,
          conteudoId: CONTEUDO_LINGUAGENS_ID,
          nivelPrioridade: NivelPrioridade.MEDIA,
        }),
        expect.objectContaining({
          alunoId: ALUNO_ID,
          disciplinaId: MATEMATICA_ID,
          conteudoId: CONTEUDO_MATEMATICA_ID,
          nivelPrioridade: NivelPrioridade.CRITICA,
        }),
      ]),
    );

    const linguagens = gaps.find((gap) => gap.disciplinaId === LINGUAGENS_ID);
    expect(linguagens.desempenho.toNumber()).toBe(50);
    expect(linguagens.pontuacaoGap.toNumber()).toBe(50);
    expect(linguagens.pontuacaoUrgencia.toNumber()).toBe(50);
    expect(linguagens.pontuacaoPrioridade.toNumber()).toBe(50);

    const matematica = gaps.find((gap) => gap.disciplinaId === MATEMATICA_ID);
    expect(matematica.desempenho.toNumber()).toBe(0);
    expect(matematica.pontuacaoPrioridade.toNumber()).toBe(100);
  });

  it('nao duplica gaps nem desempenhos quando finaliza duas vezes', async () => {
    await repository.finalizeAlunoDiagnostico(ALUNO_ID, DIAGNOSTICO_ID);
    const segundo = await repository.finalizeAlunoDiagnostico(
      ALUNO_ID,
      DIAGNOSTICO_ID,
    );

    expect(segundo.kind).toBe('already_finalized');
    expect(registroCreateMany).toHaveBeenCalledTimes(1);
    expect(gapCreateMany).toHaveBeenCalledTimes(1);
    expect(diagnosticoUpdate).toHaveBeenCalledTimes(1);
    expect($executeRaw).toHaveBeenCalledTimes(2);
  });

  it('nao finaliza se a persistencia dos gaps falhar', async () => {
    gapCreateMany.mockRejectedValueOnce(new Error('falha de persistencia'));

    await expect(
      repository.finalizeAlunoDiagnostico(ALUNO_ID, DIAGNOSTICO_ID),
    ).rejects.toThrow('falha de persistencia');

    expect(diagnosticoUpdate).not.toHaveBeenCalled();
    expect(finalizado).toBe(false);
  });

  it('nao grava registros se o diagnostico estiver incompleto', async () => {
    diagnosticoFindFirst.mockImplementationOnce(() => ({
      id: DIAGNOSTICO_ID,
      status: DiagnosticoStatus.EM_ANDAMENTO,
      questoes: [
        {
          id: 'q1',
          questionIndex: 1,
          resposta: null,
        },
      ],
    }));

    const resultado = await repository.finalizeAlunoDiagnostico(
      ALUNO_ID,
      DIAGNOSTICO_ID,
    );

    expect(resultado.kind).toBe('incomplete');
    expect(registroCreateMany).not.toHaveBeenCalled();
    expect(gapCreateMany).not.toHaveBeenCalled();
  });
});
