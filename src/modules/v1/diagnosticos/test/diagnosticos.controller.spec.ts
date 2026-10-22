import { AlunoPapel } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { DiagnosticosController } from '../diagnosticos.controller';
import { DiagnosticosService } from '../diagnosticos.service';

jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

const user: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Aluno Teste',
  email: 'aluno@example.com',
  papel: AlunoPapel.ALUNO,
};

const DIAGNOSTICO_ID = '33333333-3333-4333-8333-333333333333';

describe('DiagnosticosController', () => {
  const create = jest.fn();
  const findCurrent = jest.fn();
  const findHistory = jest.fn();
  const findOne = jest.fn();
  const findQuestions = jest.fn();
  const registerResponses = jest.fn();
  const updateResponse = jest.fn();
  const finalize = jest.fn();
  const findResult = jest.fn();

  const service = {
    create,
    findCurrent,
    findHistory,
    findOne,
    findQuestions,
    registerResponses,
    updateResponse,
    finalize,
    findResult,
  } as unknown as DiagnosticosService;

  let controller: DiagnosticosController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DiagnosticosController(service);
  });

  it('deriva o aluno do usuário autenticado ao criar diagnóstico', async () => {
    await controller.create(user);
    expect(create).toHaveBeenCalledWith(user.id);
  });

  it('usa o aluno autenticado ao registrar respostas', async () => {
    const dto = {
      respostas: [
        {
          diagnosticoQuestaoId: '44444444-4444-4444-8444-444444444444',
          alternativaMarcada: 'A',
        },
      ],
    };

    await controller.registerResponses(user, DIAGNOSTICO_ID, dto);

    expect(registerResponses).toHaveBeenCalledWith(
      user.id,
      DIAGNOSTICO_ID,
      dto,
    );
  });

  it('usa o aluno autenticado ao editar uma resposta', async () => {
    const respostaId = '55555555-5555-4555-8555-555555555555';
    const dto = { alternativaMarcada: 'B' };

    await controller.updateResponse(user, DIAGNOSTICO_ID, respostaId, dto);

    expect(updateResponse).toHaveBeenCalledWith(
      user.id,
      DIAGNOSTICO_ID,
      respostaId,
      dto,
    );
  });

  it('usa o aluno autenticado ao finalizar o diagnóstico', async () => {
    await controller.finalize(user, DIAGNOSTICO_ID);
    expect(finalize).toHaveBeenCalledWith(user.id, DIAGNOSTICO_ID);
  });

  it('usa o aluno autenticado ao consultar o resultado', async () => {
    await controller.findResult(user, DIAGNOSTICO_ID);
    expect(findResult).toHaveBeenCalledWith(user.id, DIAGNOSTICO_ID);
  });

  it('usa ownership do usuário autenticado ao consultar um diagnóstico', async () => {
    await controller.findOne(user, DIAGNOSTICO_ID);
    expect(findOne).toHaveBeenCalledWith(user.id, DIAGNOSTICO_ID);
  });

  it('usa ownership do usuário autenticado ao consultar questões', async () => {
    await controller.findQuestions(user, DIAGNOSTICO_ID);
    expect(findQuestions).toHaveBeenCalledWith(user.id, DIAGNOSTICO_ID);
  });
});
