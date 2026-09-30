import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConteudoDto {
  @ApiProperty({
    example: 'Funções',
    description: 'Nome do conteúdo dentro da disciplina.',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Define se o conteúdo está disponível no catálogo.',
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
