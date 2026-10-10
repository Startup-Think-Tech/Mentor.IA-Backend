import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RegistrarRespostaDiagnosticoItemDto {
  @ApiProperty({
    description: 'UUID da referência de questão pertencente ao diagnóstico.',
    format: 'uuid',
  })
  @IsUUID()
  diagnosticoQuestaoId!: string;

  @ApiProperty({ example: 'A', maxLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  alternativaMarcada!: string;

  @ApiPropertyOptional({
    description:
      'Correção informada pelo frontend a partir do gabarito público. O backend persiste como não verificada.',
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  acertoInformado?: boolean;
}

export class RegistrarRespostasDiagnosticoDto {
  @ApiProperty({
    type: [RegistrarRespostaDiagnosticoItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegistrarRespostaDiagnosticoItemDto)
  respostas!: RegistrarRespostaDiagnosticoItemDto[];
}
