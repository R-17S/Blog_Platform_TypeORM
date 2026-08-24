import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  RequestWithUser,
  RequestWithUserId,
} from '../interfaces/request-with-user.interface';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    // return request.userId ?? undefined;
    return request.user.id;
  },
);
