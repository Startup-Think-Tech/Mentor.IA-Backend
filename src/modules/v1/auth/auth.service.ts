import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { HashingService } from './hashing/hashing.service';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const senhaHash = await this.hashingService.hash(registerDto.password);

    try {
      const aluno = await this.authRepository.createAluno({
        email: registerDto.email.toLowerCase(),
        nome: registerDto.nome,
        senhaHash,
      });

      return this.createAuthResponse({
        email: aluno.email,
        id: aluno.id,
        nome: aluno.nome,
        papel: aluno.papel,
      });
    } catch (error) {
      if (this.authRepository.isUniqueConstraintError(error)) {
        throw new ConflictException('E-mail já cadastrado.');
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const aluno = await this.authRepository.findActiveAlunoByEmail(
      loginDto.email.toLowerCase(),
    );

    if (!aluno) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      aluno.senhaHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.createAuthResponse({
      email: aluno.email,
      id: aluno.id,
      nome: aluno.nome,
      papel: aluno.papel,
    });
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('jwtRefreshSecret'),
        },
      );
      const aluno = await this.authRepository.findActiveAlunoById(payload.sub);

      if (!aluno) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      return this.createAuthResponse({
        email: aluno.email,
        id: aluno.id,
        nome: aluno.nome,
        papel: aluno.papel,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }
  }

  me(user: AuthenticatedUser) {
    return { user };
  }

  logout() {
    return { message: 'Logout realizado com sucesso.' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const aluno = await this.authRepository.findActiveAlunoByEmail(
      forgotPasswordDto.email.toLowerCase(),
    );

    if (!aluno) {
      return this.createForgotPasswordResponse();
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlMinutes =
      this.configService.get<number>('passwordResetTtlMinutes') ?? 30;

    await this.authRepository.createPasswordReset({
      alunoId: aluno.id,
      expiraEm: new Date(Date.now() + ttlMinutes * 60 * 1000),
      tokenHash,
    });

    return this.createForgotPasswordResponse(token);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordReset = await this.authRepository.findValidPasswordReset(
      this.hashToken(resetPasswordDto.token),
    );

    if (!passwordReset) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    await this.authRepository.resetPassword({
      alunoId: passwordReset.alunoId,
      passwordResetId: passwordReset.id,
      senhaHash: await this.hashingService.hash(resetPasswordDto.password),
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  private createForgotPasswordResponse(token?: string) {
    const response: { message: string; resetToken?: string } = {
      message:
        'Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.',
    };

    if (token && this.configService.get<string>('nodeEnv') !== 'production') {
      response.resetToken = token;
    }

    return response;
  }

  private async createAuthResponse(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      email: user.email,
      papel: user.papel,
      sub: user.id,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.getJwtExpiresIn('jwtExpiresIn', '1d'),
        secret: this.configService.getOrThrow<string>('jwtSecret'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.getJwtExpiresIn('jwtRefreshExpiresIn', '7d'),
        secret: this.configService.getOrThrow<string>('jwtRefreshSecret'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private getJwtExpiresIn(configKey: string, fallback: string) {
    return (this.configService.get<string>(configKey) ??
      fallback) as JwtSignOptions['expiresIn'];
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
