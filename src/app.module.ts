import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { rabbitMqConfig } from './config/rabbitmq.config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { RabbitMqModule } from './modules/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, rabbitMqConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    RabbitMqModule,
  ],
})
export class AppModule {}
