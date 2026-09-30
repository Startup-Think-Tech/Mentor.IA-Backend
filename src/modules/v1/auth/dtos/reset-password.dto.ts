import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'token-de-recuperacao',
    description: 'Token de recuperação de uso único.',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'nova-senha-segura',
    description: 'Nova senha com no mínimo 8 caracteres.',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
