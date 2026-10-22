import { DiagnosticoStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
