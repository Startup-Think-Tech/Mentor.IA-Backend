export const appConfig = () => ({
  apiDocsPath: process.env.API_DOCS_PATH ?? 'api/docs',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  insightActiveJobLimit: Number(process.env.INSIGHT_ACTIVE_JOB_LIMIT ?? 1),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),
  port: Number(process.env.PORT ?? 3333),
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
});
