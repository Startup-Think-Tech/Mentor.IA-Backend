import { TipoOrigemDesempenho } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DesempenhoDisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Matemática' })
  nome!: string;

  @ApiProperty({ example: 'matematica' })
  codigo!: string;
}

export class DesempenhoConteudoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Funções' })
  nome!: string;
}

export class DesempenhoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  diagnosticoId!: string | null;

  @ApiProperty({ type: DesempenhoDisciplinaResponseDto })
  disciplina!: DesempenhoDisciplinaResponseDto;

  @ApiProperty({ type: DesempenhoConteudoResponseDto })
  conteudo!: DesempenhoConteudoResponseDto;

  @ApiProperty({ enum: TipoOrigemDesempenho })
  tipoOrigem!: TipoOrigemDesempenho;

  @ApiProperty({ example: 5 })
  totalQuestoes!: number;

  @ApiProperty({ example: 4 })
  acertos!: number;

  @ApiProperty({ example: 80 })
  percentual!: number;

  @ApiProperty({ example: false })
  correcaoVerificada!: boolean;

  @ApiProperty({ format: 'date-time' })
  registradoEm!: Date;
}
