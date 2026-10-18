import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CronogramasService } from './cronogramas.service';
import { GerarCronogramaDto } from './dto/gerar-cronograma.dto';

@ApiTags('Cronogramas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('cronogramas')
export class CronogramasController {
  constructor(private readonly service: CronogramasService) {}

  @Post('gerar')
  @ApiOperation({
    summary: 'Gera cronograma com base em gaps e disponibilidade',
  })
  gerar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GerarCronogramaDto,
  ) {
    return this.service.gerar(user.id, dto);
  }

  @Post('recalcular')
  @ApiOperation({
    summary: 'Substitui o cronograma ativo preservando o historico',
  })
  recalcular(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GerarCronogramaDto,
  ) {
    return this.service.recalcular(user.id, dto);
  }

  @Get('atual')
  @ApiOperation({ summary: 'Consulta o cronograma ativo' })
  atual(@CurrentUser() user: AuthenticatedUser) {
    return this.service.atual(user.id);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Consulta os cronogramas anteriores e atual' })
  historico(@CurrentUser() user: AuthenticatedUser) {
    return this.service.historico(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta cronograma do aluno pelo ID' })
  porId(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.porId(user.id, id);
  }
}
