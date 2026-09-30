import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConteudoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
