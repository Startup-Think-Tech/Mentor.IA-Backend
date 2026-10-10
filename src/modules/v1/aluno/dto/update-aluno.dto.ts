import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAlunoDto {
  @ApiProperty({ example: 'Lucas Chaves' })
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
