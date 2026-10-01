import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinasController } from './disciplinas.controller';
import { DisciplinasService } from './disciplinas.service';

jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

describe('DisciplinasController', () => {
  let controller: DisciplinasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisciplinasController],
      providers: [
        {
          provide: DisciplinasService,
          useValue: {
            findAll: jest.fn(),
            findContents: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DisciplinasController>(DisciplinasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
