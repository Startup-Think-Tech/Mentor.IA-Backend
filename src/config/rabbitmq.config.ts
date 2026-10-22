export const rabbitMqConfig = () => ({
  rabbitmq: {
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'mentor.events',
    insightsQueue: process.env.RABBITMQ_INSIGHTS_QUEUE ?? 'insights_queue',
    url: process.env.RABBITMQ_URL ?? 'amqp://mentor:mentor@localhost:5672',
  },
});
