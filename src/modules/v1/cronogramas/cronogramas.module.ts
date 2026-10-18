import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CronogramasController } from './cronogramas.controller';
import { CronogramasRepository } from './cronogramas.repository';
import { CronogramasService } from './cronogramas.service';

@Module({
  imports: [AuthModule],
  controllers: [CronogramasController],
  providers: [CronogramasRepository, CronogramasService],
})
export class CronogramasModule {}
