import { UserEntity } from '../../domain/user.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { OmitType } from '@nestjs/swagger';

export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserEntity): UserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

export class UsersViewPaginated extends PaginatedViewDto<UserViewModel[]> {}

export class MeViewDto extends OmitType(UserViewModel, [
  'createdAt',
  'id',
] as const) {
  userId: string;

  static mapToView(user: UserViewModel): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id;

    return dto;
  }
}
