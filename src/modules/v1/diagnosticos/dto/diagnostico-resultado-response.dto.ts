import { DiagnosticoStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { DesempenhoResponseDto } from '../desempenhos/dto/desempenho-response.dto';

export class DiagnosticoResultadoResponseDto {
  @ApiProperty({ format: 'uuid' })
  diagnosticoId!: string;

  @ApiProperty({ enum: DiagnosticoStatus })
  status!: DiagnosticoStatus;

  @ApiProperty({ example: 20 })
  totalQuestoes!: number;

  @ApiProperty({ example: 14 })
  totalAcertos!: number;

  @ApiProperty({ example: 70 })
  percentualGeral!: number;

  @ApiProperty({ format: 'date-time' })
  finalizadoEm!: Date;

  @ApiProperty({ type: [DesempenhoResponseDto] })
  desempenhos!: DesempenhoResponseDto[];
}
