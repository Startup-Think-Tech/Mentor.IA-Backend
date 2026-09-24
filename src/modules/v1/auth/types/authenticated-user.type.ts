import { AlunoPapel } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  nome: string;
  papel: AlunoPapel;
};
