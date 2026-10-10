import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class DesempenhoQueryDto {
  @ApiPropertyOptional({
    name: 'diagnostico_id',
    description: 'Filtra os registros pelo diagnóstico de origem.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnostico_id?: string;
}
