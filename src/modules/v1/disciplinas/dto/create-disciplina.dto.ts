<<<<<<< HEAD
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDisciplinaDto {
  @ApiProperty({
    example: 'Matemática',
    description: 'Nome único da disciplina.',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    example: 'matematica',
    description: 'Código único usado internamente e nas integrações.',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Define se a disciplina está disponível no catálogo.',
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
=======
export class CreateDisciplinaDto {}
>>>>>>> refs/remotes/origin/main
