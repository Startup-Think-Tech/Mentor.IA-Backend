import { ApiProperty } from '@nestjs/swagger';
import { ResultadoRevisaoTipo } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class RegistrarResultadoRevisaoDto {
  @ApiProperty({
    enum: ResultadoRevisaoTipo,
    description:
      'ERROU: reinicia em 1 dia; DIFICIL: mantém; BOM/FACIL: avança.',
    example: ResultadoRevisaoTipo.BOM,
  })
  @IsEnum(ResultadoRevisaoTipo)
  resultado!: ResultadoRevisaoTipo;
}
