import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessaoEstudoStatus, SessaoEstudoTipo } from '@prisma/client';

export class SessaoEstudoDisciplinaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Matemática' })
  nome: string;

  @ApiProperty({ example: 'matematica' })
  codigo: string;
}

export class SessaoEstudoConteudoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Geral' })
  nome: string;
}

export class SessaoEstudoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  cronogramaId: string;

  @ApiProperty({ enum: SessaoEstudoTipo })
  tipo: SessaoEstudoTipo;

  @ApiProperty({ enum: SessaoEstudoStatus })
  status: SessaoEstudoStatus;

  @ApiProperty({ format: 'date-time' })
  agendadoPara: Date;

  @ApiProperty({ example: 30 })
  duracaoMinutos: number;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  concluidoEm: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  revisaoId: string | null;

  @ApiProperty({ type: SessaoEstudoDisciplinaDto })
  disciplina: SessaoEstudoDisciplinaDto;

  @ApiProperty({ type: SessaoEstudoConteudoDto })
  conteudo: SessaoEstudoConteudoDto;
}
