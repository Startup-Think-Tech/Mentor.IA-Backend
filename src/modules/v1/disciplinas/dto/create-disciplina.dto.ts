import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDisciplinaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
