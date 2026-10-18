import { ConflictException, NotFoundException } from '@nestjs/common';
import { SessaoEstudoStatus } from '@prisma/client';
import { SessoesEstudoRepository } from './sessoes-estudo.repository';
import { SessoesEstudoService } from './sessoes-estudo.service';

describe('SessoesEstudoService', () => {
  const listar = jest.fn();
  const hoje = jest.fn();
  const buscar = jest.fn();
  const alterarStatus = jest.fn();
  const repository = {
    listar,
    hoje,
    buscar,
    alterarStatus,
  } as unknown as SessoesEstudoRepository;
  const service = new SessoesEstudoService(repository);
  const alunoId = '11111111-1111-4111-8111-111111111111';
  const id = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => jest.clearAllMocks());

  it('lista somente dados do aluno autenticado com filtros', async () => {
    const query = { status: SessaoEstudoStatus.PENDENTE, limite: 10 };
    listar.mockResolvedValue([]);
    expect(await service.listar(alunoId, query)).toEqual([]);
    expect(listar).toHaveBeenCalledWith(alunoId, query);
  });

  it('consulta sessoes de hoje no escopo do aluno', async () => {
    hoje.mockResolvedValue([]);
    expect(await service.hoje(alunoId)).toEqual([]);
    expect(hoje).toHaveBeenCalledWith(alunoId);
  });

  it('retorna 404 quando nao encontra sessao', async () => {
    buscar.mockResolvedValue(null);
    await expect(service.buscar(alunoId, id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('conclui sessao pendente e retorna o estado persistido', async () => {
    const sessao = { id, status: SessaoEstudoStatus.CONCLUIDA };
    alterarStatus.mockResolvedValue({ kind: 'ok', sessao });
    expect(await service.concluir(alunoId, id)).toEqual(sessao);
    expect(alterarStatus).toHaveBeenCalledWith(
      alunoId,
      id,
      SessaoEstudoStatus.CONCLUIDA,
    );
  });

  it('marca sessao como perdida', async () => {
    const sessao = { id, status: SessaoEstudoStatus.PERDIDA };
    alterarStatus.mockResolvedValue({ kind: 'ok', sessao });
    expect(await service.perder(alunoId, id)).toEqual(sessao);
    expect(alterarStatus).toHaveBeenCalledWith(
      alunoId,
      id,
      SessaoEstudoStatus.PERDIDA,
    );
  });

  it.each(['conflict', 'future', 'review_requires_result'])(
    'retorna 409 para transicao invalida %s',
    async (kind) => {
      alterarStatus.mockResolvedValue({ kind });
      await expect(service.concluir(alunoId, id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    },
  );

  it('retorna 404 para sessao de outro aluno', async () => {
    alterarStatus.mockResolvedValue({ kind: 'not_found' });
    await expect(service.perder(alunoId, id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
