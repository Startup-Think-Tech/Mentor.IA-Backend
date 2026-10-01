import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DisciplinasService } from './disciplinas.service';
import {
  AdminDisciplinasController,
  DisciplinasController,
} from './disciplinas.controller';
import { DisciplinasRepository } from './disciplinas.repository';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [AdminDisciplinasController, DisciplinasController],
  providers: [AdminGuard, DisciplinasRepository, DisciplinasService],
})
export class DisciplinasModule {}
