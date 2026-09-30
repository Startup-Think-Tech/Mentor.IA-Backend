import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Início do período filtrado em ISO 8601.',
    example: '2026-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({
    description: 'Fim do período filtrado em ISO 8601.',
    example: '2026-09-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  fim?: string;

  @ApiPropertyOptional({
    description: 'Filtra os dados por disciplina.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  disciplina_id?: string;

  @ApiPropertyOptional({
    description:
      'Consulta outro aluno. Quando diferente do usuário autenticado, exige papel ADMIN.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  aluno_id?: string;

  @ApiPropertyOptional({
    description: 'Página do histórico. Aceito apenas em visao=historico.',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({
    description:
      'Quantidade de registros por página. Aceito apenas em visao=historico.',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
