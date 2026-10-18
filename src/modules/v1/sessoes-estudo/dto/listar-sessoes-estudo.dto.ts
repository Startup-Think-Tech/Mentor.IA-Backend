import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessaoEstudoStatus, SessaoEstudoTipo } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListarSessoesEstudoDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtrar por cronograma.',
  })
  @IsOptional()
  @IsUUID()
  cronogramaId?: string;

  @ApiPropertyOptional({ enum: SessaoEstudoStatus })
  @IsOptional()
  @IsEnum(SessaoEstudoStatus)
  status?: SessaoEstudoStatus;

  @ApiPropertyOptional({ enum: SessaoEstudoTipo })
  @IsOptional()
  @IsEnum(SessaoEstudoTipo)
  tipo?: SessaoEstudoTipo;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
