import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InsightGenerationResponseDto {
  @ApiProperty({ format: 'uuid' })
  job_id: string;

  @ApiProperty({ example: 'pendente' })
  status: string;

  @ApiProperty({ example: '/api/v1/insights/jobs/uuid' })
  status_url: string;
}

export class InsightJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  job_id: string;

  @ApiProperty({
    enum: [
      'pendente',
      'processando',
      'aguardando_retentativa',
      'concluido',
      'falhou',
    ],
  })
  status: string;

  @ApiProperty({ example: 1 })
  tentativas: number;

  @ApiProperty({ format: 'date-time' })
  criado_em: Date;

  @ApiProperty({ format: 'date-time' })
  atualizado_em: Date;

  @ApiPropertyOptional({ format: 'date-time' })
  concluido_em?: Date | null;

  @ApiPropertyOptional({ format: 'uuid' })
  insight_id?: string | null;

  @ApiPropertyOptional()
  erro_resumo?: string | null;
}
