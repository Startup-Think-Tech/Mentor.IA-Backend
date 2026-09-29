import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AlunoController } from './aluno.controller';
import { AlunoRepository } from './aluno.repository';
import { AlunoService } from './aluno.service';

@Module({
  imports: [AuthModule],
  controllers: [AlunoController],
  providers: [AlunoService, AlunoRepository],
})
export class AlunoModule {}
