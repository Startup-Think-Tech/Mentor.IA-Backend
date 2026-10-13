import { ApiProperty } from '@nestjs/swagger';

export class InsightDisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Matemática' })
  nome: string;

  @ApiProperty({ example: 'MAT' })
  codigo: string;
}

export class InsightResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  job_id: string;

  @ApiProperty()
  conteudo: string;

  @ApiProperty({ format: 'date-time' })
  criado_em: Date;

  @ApiProperty({ type: [InsightDisciplinaResponseDto] })
  disciplinas: InsightDisciplinaResponseDto[];
}
