import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DisponibilidadeDiaDto {
  @ApiProperty({
    description: 'Dia da semana, de 0 a 6.',
    example: 0,
    maximum: 6,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @ApiProperty({
    description: 'Minutos disponíveis para estudo no dia.',
    example: 60,
    maximum: 1440,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(1440)
  minutosDisponiveis: number;
}

export class SubstituirDisponibilidadeDto {
  @ApiProperty({
    description: 'Disponibilidade completa dos sete dias da semana.',
    type: () => DisponibilidadeDiaDto,
    isArray: true,
  })
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DisponibilidadeDiaDto)
  disponibilidades: DisponibilidadeDiaDto[];
}
