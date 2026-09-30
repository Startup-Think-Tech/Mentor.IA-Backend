import { ApiProperty } from '@nestjs/swagger';

export class ConteudoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Funções' })
  nome!: string;
}
