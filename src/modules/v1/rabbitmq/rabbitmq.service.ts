import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RABBITMQ_CLIENT, RABBITMQ_EXCHANGE } from './rabbitmq.constants';

@Injectable()
export class RabbitMqService {
  private readonly logger = new Logger(RabbitMqService.name);

  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async publish(pattern: string, payload: unknown): Promise<void> {
    const exchange = this.configService.getOrThrow<string>(RABBITMQ_EXCHANGE);

    try {
      await lastValueFrom(this.client.emit<void, unknown>(pattern, payload));
      this.logger.debug(
        `RabbitMQ message published: exchange=${exchange} pattern=${pattern}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish RabbitMQ message: exchange=${exchange} pattern=${pattern}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
