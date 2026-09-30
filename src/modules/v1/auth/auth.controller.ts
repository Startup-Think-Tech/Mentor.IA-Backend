import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastrar aluno',
    description:
      'Cria uma conta pública com papel ALUNO e retorna os tokens de autenticação.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Aluno cadastrado e autenticado com sucesso.',
    schema: {
      example: {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: {
          id: 'b7f7be1f-3bbb-4d1e-a0ef-9d6c7b57f4da',
          nome: 'Ana Souza',
          email: 'ana@example.com',
          papel: 'ALUNO',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Autenticar aluno',
    description:
      'Valida e-mail e senha de um aluno ativo e retorna access token e refresh token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Login realizado com sucesso.',
    schema: {
      example: {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: {
          id: 'b7f7be1f-3bbb-4d1e-a0ef-9d6c7b57f4da',
          nome: 'Ana Souza',
          email: 'ana@example.com',
          papel: 'ALUNO',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar tokens',
    description:
      'Valida o refresh token e emite um novo par de access token e refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiCreatedResponse({ description: 'Tokens renovados com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido.' })
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Post('logout')
  @ApiOperation({
    summary: 'Encerrar sessão',
    description:
      'Finaliza a sessão no cliente. A rota exige um access token válido.',
  })
  @ApiCreatedResponse({
    description: 'Logout processado.',
    schema: {
      example: {
        message: 'Logout realizado com sucesso.',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me')
  @ApiOperation({
    summary: 'Consultar usuário autenticado',
    description: 'Retorna a identidade presente no access token válido.',
  })
  @ApiOkResponse({
    description: 'Usuário autenticado.',
    schema: {
      example: {
        user: {
          id: 'b7f7be1f-3bbb-4d1e-a0ef-9d6c7b57f4da',
          nome: 'Ana Souza',
          email: 'ana@example.com',
          papel: 'ALUNO',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access token ausente ou inválido.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  @Post('esqueceu-senha')
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Recebe um e-mail e sempre responde de forma genérica para não revelar se a conta existe.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiCreatedResponse({
    description: 'Solicitação de recuperação processada.',
    schema: {
      example: {
        message:
          'Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.',
      },
    },
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('redefinir-senha')
  @ApiOperation({
    summary: 'Redefinir senha',
    description:
      'Consome um token de recuperação válido, de uso único e não expirado, e define uma nova senha.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiCreatedResponse({
    description: 'Senha redefinida com sucesso.',
    schema: {
      example: {
        message: 'Senha redefinida com sucesso.',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
