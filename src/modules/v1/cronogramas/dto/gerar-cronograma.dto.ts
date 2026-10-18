import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class GerarCronogramaDto {
  @ApiPropertyOptional({
    description: 'Quantidade de dias para o plano, entre 7 e 28.',
    default: 14,
    minimum: 7,
    maximum: 28,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(28)
  dias?: number;

  @ApiPropertyOptional({
    description:
      'Primeiro dia (UTC) no formato YYYY-MM-DD. Padrão: amanhã (UTC).',
    example: '2026-10-19',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dataInicio?: string;
}
