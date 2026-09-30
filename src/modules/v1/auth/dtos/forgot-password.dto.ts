import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'ana@example.com',
    description: 'E-mail da conta que solicita recuperação.',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
