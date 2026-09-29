import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAlunoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
