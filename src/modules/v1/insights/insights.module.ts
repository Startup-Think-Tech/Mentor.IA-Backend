import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InsightsController } from './insights.controller';
import { InsightConsumerController } from './insight-consumer.controller';
import { InsightProcessingService } from './insight-processing.service';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { InsightsRepository } from './insights.repository';
import { InsightsService } from './insights.service';

@Module({
  imports: [AuthModule, RabbitMqModule],
  controllers: [InsightsController, InsightConsumerController],
  providers: [InsightsRepository, InsightsService, InsightProcessingService],
})
export class InsightsModule {}
