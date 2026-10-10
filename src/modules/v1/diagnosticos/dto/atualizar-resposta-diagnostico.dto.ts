import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AtualizarRespostaDiagnosticoDto {
  @ApiProperty({ example: 'B', maxLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  alternativaMarcada!: string;

  @ApiPropertyOptional({
    description:
      'Correção informada pelo frontend. Permanece não verificada pelo backend.',
    example: false,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  acertoInformado?: boolean;
}
