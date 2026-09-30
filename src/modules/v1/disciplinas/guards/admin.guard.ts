import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AlunoPapel } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.papel !== AlunoPapel.ADMIN) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    return true;
  }
}
