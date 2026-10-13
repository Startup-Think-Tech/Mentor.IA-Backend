import { DiagnosticoStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespostaDiagnosticoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  diagnosticoQuestaoId!: string;

  @ApiProperty({ example: 'A' })
  alternativaMarcada!: string;

  @ApiPropertyOptional({ nullable: true, example: true })
  acertoInformado!: boolean | null;

  @ApiProperty({ example: false })
  correcaoVerificada!: boolean;

  @ApiProperty({ format: 'date-time' })
  respondidoEm!: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm!: Date;
}

export class ProgressoDiagnosticoResponseDto {
  @ApiProperty({ format: 'uuid' })
  diagnosticoId!: string;

  @ApiProperty({ enum: DiagnosticoStatus })
  status!: DiagnosticoStatus;

  @ApiProperty({ example: 20 })
  totalQuestoes!: number;

  @ApiProperty({ example: 8 })
  respondidas!: number;

  @ApiProperty({ example: 12 })
  restantes!: number;

  @ApiProperty({ example: false })
  completo!: boolean;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  proximaQuestaoId!: string | null;

  @ApiProperty({ type: [RespostaDiagnosticoResponseDto] })
  respostas!: RespostaDiagnosticoResponseDto[];
}
