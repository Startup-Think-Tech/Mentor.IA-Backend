import { PartialType } from '@nestjs/swagger';
import { CreateConteudoDto } from './create-conteudo.dto';

export class UpdateConteudoDto extends PartialType(CreateConteudoDto) {}
