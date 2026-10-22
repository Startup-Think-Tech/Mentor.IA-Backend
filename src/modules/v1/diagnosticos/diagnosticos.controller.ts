import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AtualizarRespostaDiagnosticoDto } from './dto/atualizar-resposta-diagnostico.dto';
import { DiagnosticoQuestaoResponseDto } from './dto/diagnostico-questao-response.dto';
import { DiagnosticoResultadoResponseDto } from './dto/diagnostico-resultado-response.dto';
import { DiagnosticoResponseDto } from './dto/diagnostico-response.dto';
import { RegistrarRespostasDiagnosticoDto } from './dto/registrar-respostas-diagnostico.dto';
import { ProgressoDiagnosticoResponseDto } from './dto/resposta-diagnostico-response.dto';
import { DiagnosticosService } from './diagnosticos.service';

@ApiTags('Diagnósticos')
@ApiBearerAuth('bearer')
@Controller('diagnosticos')
@UseGuards(JwtAuthGuard)
export class DiagnosticosController {
  constructor(private readonly diagnosticosService: DiagnosticosService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria um diagnóstico para o aluno autenticado',
    description:
      'Sem body. Seleciona e persiste referências externas year/index/language. Enunciado e alternativas não são armazenados no Backend.',
  })
  @ApiCreatedResponse({
    description: 'Diagnóstico criado com as referências selecionadas.',
    type: DiagnosticoResponseDto,
  })
  @ApiConflictResponse({
    description: 'O aluno já possui um diagnóstico em andamento.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  create(@CurrentUser() user: AuthenticatedUser) {
    return this.diagnosticosService.create(user.id);
  }

  @Get('atual')
  @ApiOperation({ summary: 'Consulta o diagnóstico em andamento do aluno' })
  @ApiOkResponse({
    description: 'Diagnóstico atual.',
    type: DiagnosticoResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Não existe diagnóstico em andamento.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.diagnosticosService.findCurrent(user.id);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Lista o histórico de diagnósticos do aluno' })
  @ApiOkResponse({
    description:
      'Diagnósticos finalizados ou cancelados, mais recentes primeiro.',
    type: [DiagnosticoResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.diagnosticosService.findHistory(user.id);
  }

  @Post(':id/respostas')
  @ApiOperation({
    summary: 'Registra respostas do diagnóstico',
    description:
      'Aceita uma ou mais respostas. Questões já respondidas devem ser alteradas pela rota PATCH. O backend consulta o gabarito na fonte externa e persiste a correção verificada.',
  })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiBody({
    type: RegistrarRespostasDiagnosticoDto,
    examples: {
      umaResposta: {
        summary: 'Registrar uma resposta',
        value: {
          respostas: [
            {
              diagnosticoQuestaoId: '11111111-1111-4111-8111-111111111111',
              alternativaMarcada: 'A',
            },
          ],
        },
      },
      variasRespostas: {
        summary: 'Registrar várias respostas de uma vez',
        value: {
          respostas: [
            {
              diagnosticoQuestaoId: '11111111-1111-4111-8111-111111111111',
              alternativaMarcada: 'A',
            },
            {
              diagnosticoQuestaoId: '22222222-2222-4222-8222-222222222222',
              alternativaMarcada: 'C',
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Respostas registradas e progresso atualizado.',
    type: ProgressoDiagnosticoResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Questão inválida, repetida na solicitação ou de outro diagnóstico.',
  })
  @ApiConflictResponse({
    description: 'Diagnóstico encerrado ou questão já respondida.',
  })
  @ApiNotFoundResponse({ description: 'Diagnóstico não encontrado.' })
  registerResponses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarRespostasDiagnosticoDto,
  ) {
    return this.diagnosticosService.registerResponses(user.id, id, dto);
  }

  @Patch(':id/respostas/:respostaId')
  @ApiOperation({
    summary: 'Atualiza uma resposta do diagnóstico',
    description:
      'A edição é permitida apenas enquanto o diagnóstico estiver em andamento.',
  })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiParam({
    name: 'respostaId',
    description: 'UUID da resposta.',
    format: 'uuid',
  })
  @ApiBody({
    type: AtualizarRespostaDiagnosticoDto,
    examples: {
      editarResposta: {
        summary: 'Alterar alternativa',
        value: {
          alternativaMarcada: 'B',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Resposta atualizada e progresso recalculado.',
    type: ProgressoDiagnosticoResponseDto,
  })
  @ApiConflictResponse({ description: 'Diagnóstico não está em andamento.' })
  @ApiNotFoundResponse({
    description: 'Diagnóstico ou resposta não encontrada.',
  })
  updateResponse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('respostaId', ParseUUIDPipe) respostaId: string,
    @Body() dto: AtualizarRespostaDiagnosticoDto,
  ) {
    return this.diagnosticosService.updateResponse(
      user.id,
      id,
      respostaId,
      dto,
    );
  }

  @Post(':id/finalizar')
  @ApiOperation({
    summary: 'Finaliza o diagnóstico e consolida o desempenho',
    description:
      'Sem body. Valida todas as respostas, associa as questões às áreas oficiais do ENEM, cria os registros de desempenho e finaliza o diagnóstico de forma atômica e idempotente.',
  })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiOkResponse({
    description:
      'Diagnóstico finalizado. Chamadas repetidas retornam o mesmo resultado sem duplicar desempenho.',
    type: DiagnosticoResultadoResponseDto,
  })
  @ApiConflictResponse({
    description:
      'Diagnóstico cancelado, vazio ou ainda com respostas pendentes/não corrigidas.',
  })
  @ApiNotFoundResponse({ description: 'Diagnóstico não encontrado.' })
  finalize(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.diagnosticosService.finalize(user.id, id);
  }

  @Get(':id/resultado')
  @ApiOperation({ summary: 'Consulta o resultado persistido do diagnóstico' })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Resultado consolidado por área ENEM.',
    type: DiagnosticoResultadoResponseDto,
  })
  @ApiConflictResponse({
    description: 'O diagnóstico ainda não foi finalizado.',
  })
  @ApiNotFoundResponse({ description: 'Diagnóstico não encontrado.' })
  findResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.diagnosticosService.findResult(user.id, id);
  }

  @Get(':id/questoes')
  @ApiOperation({
    summary: 'Lista as referências das questões de um diagnóstico',
    description:
      'Retorna enunciado e alternativas sem expor o gabarito da fonte externa.',
  })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Referências em ordem de apresentação.',
    type: [DiagnosticoQuestaoResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Diagnóstico não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.diagnosticosService.findQuestions(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um diagnóstico do aluno autenticado' })
  @ApiParam({ name: 'id', description: 'UUID do diagnóstico.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Diagnóstico pertencente ao aluno.',
    type: DiagnosticoResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Diagnóstico não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.diagnosticosService.findOne(user.id, id);
  }
}
