import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminGuard } from '../../disciplinas/guards/admin.guard';
import {
  AdminDesempenhosController,
  DesempenhosController,
} from './desempenhos.controller';
import { DesempenhosRepository } from './desempenhos.repository';
import { DesempenhosService } from './desempenhos.service';

@Module({
  imports: [AuthModule],
  controllers: [DesempenhosController, AdminDesempenhosController],
  providers: [AdminGuard, DesempenhosRepository, DesempenhosService],
  exports: [DesempenhosService],
})
export class DesempenhosModule {}
