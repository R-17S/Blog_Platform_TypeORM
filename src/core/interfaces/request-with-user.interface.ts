import { Request } from 'express';
import { UserContextDto } from '../../modules/user-accounts/guards/dto/user-context.dto';

export interface RequestWithUserId extends Request {
  userId?: string;
}

export interface RequestWithUser extends Request {
  user: UserContextDto;
}
