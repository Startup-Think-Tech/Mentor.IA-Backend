import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AlunoService } from './aluno.service';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@Controller('alunos')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.alunoService.findProfile(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAlunoDto: UpdateAlunoDto,
  ) {
    return this.alunoService.updateProfile(user.id, updateAlunoDto);
  }
}
