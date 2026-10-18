import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { rabbitMqConfig } from './config/rabbitmq.config';
import { AlunoModule } from './modules/v1/aluno/aluno.module';
import { AuthModule } from './modules/v1/auth/auth.module';
import { DashboardModule } from './modules/v1/dashboard/dashboard.module';
import { CronogramasModule } from './modules/v1/cronogramas/cronogramas.module';
import { DisciplinasModule } from './modules/v1/disciplinas/disciplinas.module';
import { DesempenhosModule } from './modules/v1/diagnosticos/desempenhos/desempenhos.module';
import { DiagnosticosModule } from './modules/v1/diagnosticos/diagnosticos.module';
import { GapsModule } from './modules/v1/gaps/gaps.module';
import { HealthModule } from './modules/v1/health/health.module';
import { InsightsModule } from './modules/v1/insights/insights.module';
import { PrismaModule } from './modules/v1/prisma/prisma.module';
import { RabbitMqModule } from './modules/v1/rabbitmq/rabbitmq.module';
import { RevisoesModule } from './modules/v1/revisoes/revisoes.module';
import { SessoesEstudoModule } from './modules/v1/sessoes-estudo/sessoes-estudo.module';

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
    InsightsModule,
    RabbitMqModule,
    DisciplinasModule,
    DesempenhosModule,
    DiagnosticosModule,
    DashboardModule,
    GapsModule,
    CronogramasModule,
    SessoesEstudoModule,
    RevisoesModule,
  ],
})
export class AppModule {}
