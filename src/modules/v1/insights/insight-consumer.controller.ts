import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InsightProcessingService } from './insight-processing.service';

@Controller()
export class InsightConsumerController {
  private readonly logger = new Logger(InsightConsumerController.name);
  constructor(private readonly processing: InsightProcessingService) {}

  @EventPattern('insight.requested')
  async handle(@Payload() payload: unknown, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef() as { ack(message: unknown): void };
    const message: unknown = context.getMessage();
    try {
      if (!this.isValid(payload)) {
        this.logger.warn('Invalid insight event discarded');
        return;
      }
      await this.processing.process(payload.job_id, payload.aluno_id);
    } catch (error) {
      this.logger.error(
        'Unexpected consumer exception',
        error instanceof Error ? error.stack : undefined,
      );
      // DB claim and terminal failure are durable. Dispatcher/producer
      // remains responsible for publish retries, not infinite requeue.
    } finally {
      channel.ack(message);
    }
  }

  private isValid(
    payload: unknown,
  ): payload is { job_id: string; aluno_id: string } {
    return (
      !!payload &&
      typeof payload === 'object' &&
      'job_id' in payload &&
      typeof payload.job_id === 'string' &&
      'aluno_id' in payload &&
      typeof payload.aluno_id === 'string'
    );
  }
}
