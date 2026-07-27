import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { AuthenticatedActor, AuthenticatedRequest } from '../auth/authenticated-request';

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedActor => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.actor) {
      throw new Error('Authenticated actor is unavailable.');
    }

    return request.actor;
  },
);
