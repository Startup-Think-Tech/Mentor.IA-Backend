import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticosController } from './diagnosticos.controller';
import { DiagnosticosRepository } from './diagnosticos.repository';
import { DiagnosticosService } from './diagnosticos.service';

@Module({
  imports: [AuthModule],
  controllers: [DiagnosticosController],
  providers: [DiagnosticosRepository, DiagnosticosService],
})
export class DiagnosticosModule {}
