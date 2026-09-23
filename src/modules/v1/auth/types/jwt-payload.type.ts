import { AlunoPapel } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  papel: AlunoPapel;
};
