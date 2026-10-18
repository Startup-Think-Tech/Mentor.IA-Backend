import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ListarSessoesEstudoDto } from './dto/listar-sessoes-estudo.dto';
import { SessaoEstudoResponseDto } from './dto/sessao-estudo-response.dto';
import { SessoesEstudoService } from './sessoes-estudo.service';

@ApiTags('Sessões de estudo')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('sessoes-estudo')
export class SessoesEstudoController {
  constructor(private readonly service: SessoesEstudoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sessões de estudo do aluno autenticado' })
  @ApiOkResponse({ type: [SessaoEstudoResponseDto] })
  @ApiUnauthorizedResponse({ description: 'JWT inválido ou ausente.' })
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListarSessoesEstudoDto,
  ) {
    return this.service.listar(user.id, query);
  }

  @Get('hoje')
  @ApiOperation({ summary: 'Listar sessões do dia atual em UTC' })
  @ApiOkResponse({ type: [SessaoEstudoResponseDto] })
  hoje(@CurrentUser() user: AuthenticatedUser) {
    return this.service.hoje(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar uma sessão do aluno pelo ID' })
  @ApiOkResponse({ type: SessaoEstudoResponseDto })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada.' })
  buscar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.buscar(user.id, id);
  }

  @Post(':id/concluir')
  @ApiOperation({ summary: 'Marcar sessão de estudo pendente como concluída' })
  @ApiOkResponse({ type: SessaoEstudoResponseDto })
  @ApiConflictResponse({
    description: 'Sessão futura, encerrada ou revisão sem resultado.',
  })
  concluir(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.concluir(user.id, id);
  }

  @Post(':id/perder')
  @ApiOperation({ summary: 'Marcar sessão pendente como perdida' })
  @ApiOkResponse({ type: SessaoEstudoResponseDto })
  @ApiConflictResponse({ description: 'Sessão futura ou encerrada.' })
  perder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.perder(user.id, id);
  }
}
