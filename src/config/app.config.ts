export const appConfig = () => ({
  apiDocsPath: process.env.API_DOCS_PATH ?? 'api/docs',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  rabbitmqInsightsQueue:
    process.env.RABBITMQ_INSIGHTS_QUEUE ?? 'insights_queue',
  rabbitmqUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mentor_ia:mentor_ia@localhost:5672',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
});
