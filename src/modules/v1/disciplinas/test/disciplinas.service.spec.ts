import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinasRepository } from './disciplinas.repository';
import { DisciplinasService } from './disciplinas.service';

describe('DisciplinasService', () => {
  let service: DisciplinasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinasService,
        {
          provide: DisciplinasRepository,
          useValue: {
            findActiveDisciplines: jest.fn(),
            findActiveDisciplineById: jest.fn(),
            findActiveContentsByDisciplineId: jest.fn(),
            findAllDisciplinas: jest.fn(),
            findDisciplinaById: jest.fn(),
            createDisciplina: jest.fn(),
            updateDisciplina: jest.fn(),
            findAllConteudosByDisciplinaId: jest.fn(),
            findConteudoById: jest.fn(),
            createConteudo: jest.fn(),
            updateConteudo: jest.fn(),
            isUniqueConstraintError: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DisciplinasService>(DisciplinasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
