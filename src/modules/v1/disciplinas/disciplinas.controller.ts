import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConteudoResponseDto } from './dto/conteudo-response.dto';
import { DisciplinaResponseDto } from './dto/disciplina-response.dto';
import { DisciplinasService } from './disciplinas.service';

@ApiTags('Disciplinas')
@ApiBearerAuth()
@Controller('disciplinas')
@UseGuards(JwtAuthGuard)
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as disciplinas ativas do catálogo' })
  @ApiOkResponse({
    description: 'Disciplinas ativas em ordem alfabética.',
    type: [DisciplinaResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findAll() {
    return this.disciplinasService.findAll();
  }

  @Get(':id/conteudos')
  @ApiOperation({ summary: 'Lista os conteúdos ativos de uma disciplina' })
  @ApiParam({ name: 'id', description: 'UUID da disciplina.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Conteúdos ativos em ordem alfabética.',
    type: [ConteudoResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findContents(@Param('id', new ParseUUIDPipe()) disciplinaId: string) {
    return this.disciplinasService.findContents(disciplinaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta uma disciplina ativa do catálogo' })
  @ApiParam({ name: 'id', description: 'UUID da disciplina.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Disciplina ativa.',
    type: DisciplinaResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.disciplinasService.findOne(id);
  }
}
