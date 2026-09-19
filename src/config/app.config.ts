export const appConfig = () => ({
  apiDocsPath: process.env.API_DOCS_PATH ?? 'api/docs',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),
  port: Number(process.env.PORT ?? 3001),
  rabbitmqInsightsQueue:
    process.env.RABBITMQ_INSIGHTS_QUEUE ?? 'insights_queue',
  rabbitmqUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mentor_ia:mentor_ia@localhost:5672',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
});
