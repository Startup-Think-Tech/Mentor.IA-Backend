import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Souza', description: 'Nome do aluno.' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    example: 'ana@example.com',
    description: 'E-mail único utilizado para autenticação.',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'senha-segura',
    description: 'Senha com no mínimo 8 caracteres.',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
