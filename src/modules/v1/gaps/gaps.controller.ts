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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { GapResponseDto } from './dto/gap-response.dto';
import { GapsService } from './gaps.service';

@ApiTags('Gaps')
@ApiBearerAuth()
@Controller('gaps')
@UseGuards(JwtAuthGuard)
export class GapsController {
  constructor(private readonly gapsService: GapsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os gaps atuais do aluno' })
  @ApiOkResponse({
    description: 'Snapshot mais recente por disciplina e conteúdo.',
    type: [GapResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.gapsService.findCurrent(user.id);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Lista o histórico de gaps do aluno' })
  @ApiOkResponse({
    description: 'Snapshots de gaps em ordem decrescente de cálculo.',
    type: [GapResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.gapsService.findHistory(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um gap do aluno' })
  @ApiParam({ name: 'id', description: 'UUID do gap.', format: 'uuid' })
  @ApiOkResponse({ description: 'Gap do aluno.', type: GapResponseDto })
  @ApiNotFoundResponse({ description: 'Gap não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.gapsService.findOne(user.id, id);
  }
}
