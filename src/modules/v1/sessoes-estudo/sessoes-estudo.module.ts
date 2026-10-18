import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SessoesEstudoController } from './sessoes-estudo.controller';
import { SessoesEstudoRepository } from './sessoes-estudo.repository';
import { SessoesEstudoService } from './sessoes-estudo.service';

@Module({
  imports: [AuthModule],
  controllers: [SessoesEstudoController],
  providers: [SessoesEstudoService, SessoesEstudoRepository],
})
export class SessoesEstudoModule {}
