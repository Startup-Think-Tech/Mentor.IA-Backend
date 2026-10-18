import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.get<string>('apiPrefix') ?? 'api/v1');
  app.enableCors({
    origin: configService.get<string[]>('corsOrigins') ?? [
      'http://localhost:3000',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  if (process.env.INSIGHT_PROCESSING_ENABLED === 'true') {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [
          configService.get<string>('rabbitmq.url') ?? 'amqp://localhost:5672',
        ],
        queue:
          configService.get<string>('rabbitmq.insightsQueue') ??
          'mentor.insights',
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 1,
      },
    });
    await app.startAllMicroservices();
  }

  setupSwagger(app);

  await app.listen(configService.get<number>('port') ?? 3333);
}
void bootstrap();
