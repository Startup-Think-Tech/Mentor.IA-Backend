import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateInsightDto } from './dto/create-insight.dto';
import {
  InsightGenerationResponseDto,
  InsightJobResponseDto,
} from './dto/insight-job-response.dto';
import { InsightResponseDto } from './dto/insight-response.dto';
import { InsightsService } from './insights.service';

@ApiTags('Insights')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post('gerar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Agenda a geração assíncrona de um insight' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Chave única da solicitação por aluno.',
  })
  @ApiAcceptedResponse({
    description: 'Job registrado e agendado para publicação na fila.',
    type: InsightGenerationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Idempotency-Key ausente ou inválida.',
  })
  @ApiConflictResponse({
    description: 'Idempotency-Key foi reutilizada com outro payload.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Limite de jobs de insight ativos atingido.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Não foi possível persistir o job de forma durável.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() payload: CreateInsightDto,
  ) {
    return this.insightsService.generate(user.id, idempotencyKey, payload);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Consulta o estado de processamento de um job' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  @ApiOkResponse({ type: InsightJobResponseDto })
  @ApiNotFoundResponse({ description: 'Job de insight não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.insightsService.findJob(user.id, jobId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os insights persistidos do aluno' })
  @ApiOkResponse({ type: [InsightResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.insightsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um insight persistido do aluno' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InsightResponseDto })
  @ApiNotFoundResponse({ description: 'Insight não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.insightsService.findOne(user.id, id);
  }
}
