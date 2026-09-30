import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar saúde da API',
    description:
      'Verifica a disponibilidade da aplicação e a conectividade com o banco de dados.',
  })
  @ApiOkResponse({
    description: 'Estado atual da API e do banco.',
    schema: {
      oneOf: [
        {
          example: {
            status: 'ok',
            database: 'ok',
            timestamp: '2026-09-30T23:45:00.000Z',
          },
        },
        {
          example: {
            status: 'error',
            database: 'error',
            timestamp: '2026-09-30T23:45:00.000Z',
          },
        },
      ],
    },
  })
  check() {
    return this.healthService.check();
  }
}
