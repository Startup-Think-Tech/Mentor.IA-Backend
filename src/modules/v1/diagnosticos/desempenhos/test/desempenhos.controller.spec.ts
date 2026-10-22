import { AlunoPapel } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AdminDesempenhosController,
  DesempenhosController,
} from './desempenhos.controller';
import { DesempenhosService } from './desempenhos.service';

jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

jest.mock('../../disciplinas/guards/admin.guard', () => ({
  AdminGuard: class AdminGuard {},
}));

const user: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Aluno Teste',
  email: 'aluno@example.com',
  papel: AlunoPapel.ALUNO,
};
const ALUNO_ALVO_ID = '22222222-2222-4222-8222-222222222222';
const DISCIPLINA_ID = '33333333-3333-4333-8333-333333333333';
const DIAGNOSTICO_ID = '44444444-4444-4444-8444-444444444444';

describe('DesempenhosController', () => {
  const findCurrent = jest.fn();
  const findHistory = jest.fn();
  const findByDiscipline = jest.fn();
  const service = {
    findCurrent,
    findHistory,
    findByDiscipline,
  } as unknown as DesempenhosService;

  beforeEach(() => jest.clearAllMocks());

  it('deriva o aluno do JWT ao consultar desempenho atual', async () => {
    const controller = new DesempenhosController(service);
    await controller.findCurrent(user, { diagnostico_id: DIAGNOSTICO_ID });

    expect(findCurrent).toHaveBeenCalledWith(user.id, DIAGNOSTICO_ID);
  });

  it('deriva o aluno do JWT ao consultar desempenho por disciplina', async () => {
    const controller = new DesempenhosController(service);
    await controller.findByDiscipline(user, DISCIPLINA_ID, {});

    expect(findByDiscipline).toHaveBeenCalledWith(
      user.id,
      DISCIPLINA_ID,
      undefined,
    );
  });

  it('usa alunoId da rota apenas no controller administrativo', async () => {
    const controller = new AdminDesempenhosController(service);
    await controller.findHistory(ALUNO_ALVO_ID, {});

    expect(findHistory).toHaveBeenCalledWith(ALUNO_ALVO_ID, undefined);
  });
});
