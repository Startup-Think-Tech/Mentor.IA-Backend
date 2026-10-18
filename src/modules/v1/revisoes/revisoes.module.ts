import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RevisoesController } from './revisoes.controller';
import { RevisoesRepository } from './revisoes.repository';
import { RevisoesService } from './revisoes.service';

@Module({
  imports: [AuthModule],
  controllers: [RevisoesController],
  providers: [RevisoesRepository, RevisoesService],
})
export class RevisoesModule {}
