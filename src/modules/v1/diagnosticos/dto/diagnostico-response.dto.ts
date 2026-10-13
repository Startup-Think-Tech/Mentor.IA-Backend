import { DiagnosticoStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnosticoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: DiagnosticoStatus })
  status!: DiagnosticoStatus;

  @ApiProperty({ example: 20 })
  totalQuestoes!: number;

  @ApiProperty({ format: 'date-time' })
  criadoEm!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  finalizadoEm!: Date | null;
}
