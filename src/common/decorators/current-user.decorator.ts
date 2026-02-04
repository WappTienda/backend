import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
