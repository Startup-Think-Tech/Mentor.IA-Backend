import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { DisciplinasService } from './disciplinas.service';
import {
  AdminDisciplinasController,
  DisciplinasController,
} from './disciplinas.controller';
import { DisciplinasRepository } from './disciplinas.repository';
import { AdminGuard } from './guards/admin.guard';

@Module({
  controllers: [AdminDisciplinasController, DisciplinasController],
  providers: [AdminGuard, DisciplinasRepository, DisciplinasService],
=======
import { AuthModule } from '../auth/auth.module';
import { DisciplinasService } from './disciplinas.service';
import { DisciplinasController } from './disciplinas.controller';
import { DisciplinasRepository } from './disciplinas.repository';

@Module({
  imports: [AuthModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasRepository, DisciplinasService],
>>>>>>> refs/remotes/origin/main
})
export class DisciplinasModule {}
