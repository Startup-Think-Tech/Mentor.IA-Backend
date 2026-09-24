import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  RABBITMQ_CLIENT,
  RABBITMQ_INSIGHTS_QUEUE,
  RABBITMQ_URL,
} from './rabbitmq.constants';
import { RabbitMqService } from './rabbitmq.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        name: RABBITMQ_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            persistent: true,
            queue: configService.getOrThrow<string>(RABBITMQ_INSIGHTS_QUEUE),
            queueOptions: {
              durable: true,
            },
            urls: [configService.getOrThrow<string>(RABBITMQ_URL)],
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
