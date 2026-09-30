import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DisciplinasService } from './disciplinas.service';
import { DisciplinasController } from './disciplinas.controller';
import { DisciplinasRepository } from './disciplinas.repository';

@Module({
  imports: [AuthModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasRepository, DisciplinasService],
})
export class DisciplinasModule {}
