import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InsightsController } from './insights.controller';
import { InsightsRepository } from './insights.repository';
import { InsightsService } from './insights.service';

@Module({
  imports: [AuthModule],
  controllers: [InsightsController],
  providers: [InsightsRepository, InsightsService],
})
export class InsightsModule {}
