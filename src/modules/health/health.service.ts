import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check() {
    try {
      await this.healthRepository.checkDatabase();

      return {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        database: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
