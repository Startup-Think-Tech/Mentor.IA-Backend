import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
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
