import Joi from 'joi';

export function validateEnv(config: Record<string, unknown>) {
  const schema = Joi.object({
    API_DOCS_PATH: Joi.string().default('api/docs'),
    API_PREFIX: Joi.string().default('api/v1'),
    CORS_ORIGINS: Joi.string().default(
      'http://localhost:3000,http://localhost:3002',
    ),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ['postgresql', 'postgres'] })
      .required(),
    DATABASE_URL_DOCKER: Joi.string()
      .uri({ scheme: ['postgresql', 'postgres'] })
      .optional(),
    JWT_EXPIRES_IN: Joi.string().default('1d'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
    JWT_SECRET: Joi.string().min(32).required(),
    INSIGHT_ACTIVE_JOB_LIMIT: Joi.number().integer().min(1).default(1),
    INSIGHT_PROCESSING_ENABLED: Joi.boolean()
      .truthy('true')
      .falsy('false')
      .default(false),
    INSIGHT_AI_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .optional(),
    INSIGHT_AI_MODEL: Joi.string().allow('').optional(),
    INSIGHT_AI_API_KEY: Joi.string().allow('').optional(),
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(1).default(30),
    PORT: Joi.number().port().default(3333),
    POSTGRES_DB: Joi.string().optional(),
    POSTGRES_PASSWORD: Joi.string().optional(),
    POSTGRES_PORT: Joi.number().port().optional(),
    POSTGRES_USER: Joi.string().optional(),
    RABBITMQ_EXCHANGE: Joi.string().default('mentor.events'),
    RABBITMQ_INSIGHTS_QUEUE: Joi.string().default('insights_queue'),
    RABBITMQ_URL: Joi.string()
      .uri({ scheme: ['amqp', 'amqps'] })
      .default('amqp://mentor:mentor@localhost:5672'),
    RABBITMQ_URL_DOCKER: Joi.string()
      .uri({ scheme: ['amqp', 'amqps'] })
      .optional(),
    RABBITMQ_MANAGEMENT_PORT: Joi.number().port().optional(),
    RABBITMQ_PASSWORD: Joi.string().optional(),
    RABBITMQ_PORT: Joi.number().port().optional(),
    RABBITMQ_USER: Joi.string().optional(),
    REDIS_URL: Joi.string()
      .uri({ scheme: ['redis', 'rediss'] })
      .optional(),
    SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  }).unknown(true);

  const result = schema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (result.error) {
    throw new Error(
      `Config validation error: ${result.error.details
        .map((detail) => detail.message)
        .join(', ')}`,
    );
  }

  return result.value as Record<string, unknown>;
}
