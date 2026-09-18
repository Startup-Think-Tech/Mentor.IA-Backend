import Joi from 'joi';

export function validateEnv(config: Record<string, unknown>) {
  const schema = Joi.object({
    API_DOCS_PATH: Joi.string().default('api/docs'),
    API_PREFIX: Joi.string().default('api/v1'),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ['postgresql', 'postgres'] })
      .required(),
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().port().default(3001),
    RABBITMQ_INSIGHTS_QUEUE: Joi.string().default('insights_queue'),
    RABBITMQ_URL: Joi.string()
      .uri({ scheme: ['amqp', 'amqps'] })
      .default('amqp://mentor_ia:mentor_ia@localhost:5672'),
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
