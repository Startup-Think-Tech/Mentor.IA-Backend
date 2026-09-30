import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GapsController } from './gaps.controller';
import { GapsRepository } from './gaps.repository';
import { GapsService } from './gaps.service';

@Module({
  imports: [AuthModule],
  controllers: [GapsController],
  providers: [GapsRepository, GapsService],
})
export class GapsModule {}
