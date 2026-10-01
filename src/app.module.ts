import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { rabbitMqConfig } from './config/rabbitmq.config';
import { AlunoModule } from './modules/v1/aluno/aluno.module';
import { AuthModule } from './modules/v1/auth/auth.module';
import { DashboardModule } from './modules/v1/dashboard/dashboard.module';
import { DisciplinasModule } from './modules/v1/disciplinas/disciplinas.module';
import { GapsModule } from './modules/v1/gaps/gaps.module';
import { HealthModule } from './modules/v1/health/health.module';
import { PrismaModule } from './modules/v1/prisma/prisma.module';
import { RabbitMqModule } from './modules/v1/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, rabbitMqConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    AlunoModule,
    HealthModule,
    RabbitMqModule,
    DisciplinasModule,
    DashboardModule,
    GapsModule,
  ],
})
export class AppModule {}
