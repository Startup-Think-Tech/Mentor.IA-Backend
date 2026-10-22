import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EnemDiscipline } from '../useCases/enem-discipline';

class DiagnosticoAlternativaResponseDto {
  @ApiProperty({ example: 'A' })
  letter!: string;

  @ApiPropertyOptional({ example: 'Texto da alternativa.', nullable: true })
  text!: string | null;

  @ApiPropertyOptional({
    example: 'https://enem.dev/2023/questions/141/alternativa.jpg',
    nullable: true,
  })
  imageUrl!: string | null;
}

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

  @ApiProperty({ example: 'Título da questão.' })
  title!: string;

  @ApiPropertyOptional({ example: 'Contexto da questão.', nullable: true })
  context!: string | null;

  @ApiProperty({ example: 'Enunciado da questão.' })
  question!: string;

  @ApiProperty({ type: [DiagnosticoAlternativaResponseDto] })
  alternatives!: DiagnosticoAlternativaResponseDto[];
}
