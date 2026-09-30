import { NivelPrioridade } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class GapDisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Matemática' })
  nome: string;

  @ApiProperty({ example: 'MAT' })
  codigo: string;
}

export class GapConteudoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Funções' })
  nome: string;
}

export class GapResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: GapDisciplinaResponseDto })
  disciplina: GapDisciplinaResponseDto;

  @ApiProperty({ type: GapConteudoResponseDto })
  conteudo: GapConteudoResponseDto;

  @ApiProperty({ example: 42.5 })
  desempenho: number;

  @ApiProperty({ example: 57.5 })
  pontuacaoGap: number;

  @ApiProperty({ example: 70 })
  pontuacaoUrgencia: number;

  @ApiProperty({ example: 61.25 })
  pontuacaoPrioridade: number;

  @ApiProperty({ enum: NivelPrioridade, example: NivelPrioridade.ALTA })
  nivelPrioridade: NivelPrioridade;

  @ApiProperty({ format: 'date-time' })
  calculadoEm: Date;
}
