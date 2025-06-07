import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as PrismaUser } from '../../generated/prisma';

interface User extends PrismaUser {
  role: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);