import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authRepository: AuthRepository,
    configService: ConfigService,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('jwtSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const aluno = await this.authRepository.findActiveAlunoById(payload.sub);

    if (!aluno) {
      throw new UnauthorizedException('Token inválido.');
    }

    return {
      email: aluno.email,
      id: aluno.id,
      nome: aluno.nome,
      papel: aluno.papel,
    };
  }
}
