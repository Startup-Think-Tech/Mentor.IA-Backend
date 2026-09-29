import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { DisponibilidadeController } from './disponibilidade.controller';
import { DisponibilidadeRepository } from './disponibilidade.repository';
import { DisponibilidadeService } from './disponibilidade.service';

@Module({
  imports: [AuthModule],
  controllers: [DisponibilidadeController],
  providers: [DisponibilidadeRepository, DisponibilidadeService],
})
export class DisponibilidadeModule {}
