import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticosController } from './diagnosticos.controller';
import { DiagnosticosRepository } from './diagnosticos.repository';
import { DiagnosticosService } from './diagnosticos.service';
import { EnemQuestionsService } from './useCases/enem-questions.service';

@Module({
  imports: [AuthModule],
  controllers: [DiagnosticosController],
  providers: [
    DiagnosticosRepository,
    DiagnosticosService,
    EnemQuestionsService,
  ],
})
export class DiagnosticosModule {}
