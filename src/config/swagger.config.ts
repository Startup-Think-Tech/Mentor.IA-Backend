import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const swaggerEnabled = configService.get<boolean>('swaggerEnabled') ?? true;

  if (!swaggerEnabled) {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mentor.ia API')
    .setDescription(
      [
        'Documentação da API REST do Mentor.ia.',
        '',
        'As rotas de negócio usam o prefixo /api/v1. Rotas autenticadas recebem um JWT no header Authorization: Bearer <token>.',
        'Rotas administrativas também exigem papel ADMIN.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token retornado por /api/v1/auth/login.',
      },
      'bearer',
    )
    .addTag('Autenticação', 'Cadastro, login, sessão e recuperação de senha.')
    .addTag('Health', 'Verificação de disponibilidade da API e do banco.')
    .addTag(
      'Disciplinas',
      'Consulta autenticada do catálogo ativo de disciplinas e conteúdos.',
    )
    .addTag(
      'Admin - Disciplinas',
      'Administração de disciplinas e conteúdos. Requer papel ADMIN.',
    )
    .addTag('Dashboard', 'Resumo e histórico acadêmico do aluno autenticado.')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const docsPath = configService.get<string>('apiDocsPath') ?? 'api/docs';

  SwaggerModule.setup(docsPath, app, swaggerDocument, {
    customSiteTitle: 'Mentor.ia API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
