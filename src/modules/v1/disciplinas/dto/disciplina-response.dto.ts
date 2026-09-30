import { ApiProperty } from '@nestjs/swagger';

export class DisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Matemática' })
  nome!: string;

  @ApiProperty({ example: 'MAT' })
  codigo!: string;
}
