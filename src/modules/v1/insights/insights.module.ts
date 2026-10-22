import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InsightsController } from './insights.controller';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { InsightsRepository } from './insights.repository';
import { InsightsService } from './insights.service';
import { InsightConsumerController } from './useCases/insight-consumer.controller';
import { InsightProcessingService } from './useCases/insight-processing.service';

@Module({
  imports: [AuthModule, RabbitMqModule],
  controllers: [InsightsController, InsightConsumerController],
  providers: [InsightsRepository, InsightsService, InsightProcessingService],
})
export class InsightsModule {}
