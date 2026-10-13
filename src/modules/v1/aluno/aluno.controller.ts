import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AlunoService } from './aluno.service';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@ApiTags('Aluno')
@ApiBearerAuth('bearer')
@Controller('alunos')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consultar perfil do aluno autenticado' })
  @ApiOkResponse({ description: 'Perfil do aluno autenticado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.alunoService.findProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar nome do aluno autenticado' })
  @ApiBody({
    type: UpdateAlunoDto,
    schema: { example: { nome: 'Lucas Chaves' } },
  })
  @ApiOkResponse({ description: 'Perfil atualizado.' })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente, inválido ou expirado.',
  })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAlunoDto: UpdateAlunoDto,
  ) {
    return this.alunoService.updateProfile(user.id, updateAlunoDto);
  }
}
