import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-pattern
    interface User extends PrismaUser {}
  }
}

export {};