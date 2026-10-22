import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EnemDiscipline } from '../useCases/enem-discipline';

export class DiagnosticoQuestaoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 2023 })
  year!: number;

  @ApiProperty({ example: 96 })
  index!: number;

  @ApiProperty({ example: 'default' })
  language!: string;

  @ApiProperty({
    enum: ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'],
    example: 'ciencias-natureza',
    description:
      'Área oficial da questão, no mesmo formato usado pela enem.dev.',
  })
  discipline!: EnemDiscipline;

  @ApiProperty({ example: 11 })
  ordem!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  disciplinaId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  conteudoId!: string | null;
}
