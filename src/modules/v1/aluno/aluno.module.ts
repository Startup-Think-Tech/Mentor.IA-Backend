import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DisponibilidadeModule } from './disponibilidade/disponibilidade.module';
import { AlunoService } from './aluno.service';
import { AlunoController } from './aluno.controller';
import { AlunoRepository } from './aluno.repository';

@Module({
  imports: [AuthModule, DisponibilidadeModule],
  controllers: [AlunoController],
  providers: [AlunoService, AlunoRepository],
})
export class AlunoModule {}
