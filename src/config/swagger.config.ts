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
      'API para diagnostico, cronograma, revisoes e insights ENEM.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const docsPath = configService.get<string>('apiDocsPath') ?? 'api/docs';

  SwaggerModule.setup(docsPath, app, swaggerDocument);
}
