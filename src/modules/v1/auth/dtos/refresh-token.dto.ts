import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'jwt-refresh-token',
    description: 'Refresh token emitido pelo login ou por uma renovação anterior.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
