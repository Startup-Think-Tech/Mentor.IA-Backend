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
        '',
        'Fluxo recomendado para teste manual: register -> login -> disponibilidade -> criar diagnóstico -> consultar questões -> registrar respostas -> finalizar -> consultar resultado/desempenho.',
        'O conteúdo visual e o gabarito das questões são obtidos pelo frontend diretamente na enem.dev usando year/index. O backend não armazena enunciado ou alternativas.',
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
    .addTag('Aluno', 'Perfil do aluno autenticado.')
    .addTag(
      'Disponibilidade',
      'Disponibilidade semanal usada posteriormente pelo motor de cronograma.',
    )
    .addTag(
      'Disciplinas',
      'Consulta autenticada do catálogo ativo de disciplinas e conteúdos.',
    )
    .addTag(
      'Admin - Disciplinas',
      'Administração de disciplinas e conteúdos. Requer papel ADMIN.',
    )
    .addTag(
      'Diagnósticos',
      'Criação, questões, respostas, finalização e resultado do diagnóstico.',
    )
    .addTag(
      'Diagnósticos - Desempenhos',
      'Desempenho consolidado do aluno derivado dos diagnósticos finalizados.',
    )
    .addTag(
      'Admin - Diagnósticos - Desempenhos',
      'Consulta administrativa de desempenho. Requer papel ADMIN.',
    )
    .addTag('Dashboard', 'Resumo e histórico acadêmico do aluno autenticado.')
    .addTag(
      'Insights',
      'Geração assíncrona de insights e consulta do estado dos jobs.',
    )
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
