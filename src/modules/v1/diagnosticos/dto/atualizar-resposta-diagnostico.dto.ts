import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AtualizarRespostaDiagnosticoDto {
  @ApiProperty({ example: 'B', maxLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  alternativaMarcada!: string;
}
