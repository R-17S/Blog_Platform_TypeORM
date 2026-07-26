import { Injectable } from '@nestjs/common';
import {
  UsersViewPaginated,
  UserViewModel,
} from '../../api/view-dto/users.view-dto';
import { UserInputQuery } from '../../api/input-dto/get-users-query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../domain/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersTypeOrmRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers(params: UserInputQuery): Promise<UsersViewPaginated> {
    const queryBuilder = this.usersTypeOrmRepository.createQueryBuilder('u');

    if (params.searchLoginTerm && params.searchEmailTerm) {
      queryBuilder.andWhere(
        '(u.login ILIKE :loginTerm OR u.email ILIKE :emailTerm)',
        {
          loginTerm: `%${params.searchLoginTerm}%`,
          emailTerm: `%${params.searchEmailTerm}%`,
        },
      );
    } else if (params.searchLoginTerm) {
      queryBuilder.andWhere('u.login ILIKE :loginTerm', {
        loginTerm: `%${params.searchLoginTerm}%`,
      });
    } else if (params.searchEmailTerm) {
      queryBuilder.andWhere('u.email ILIKE :emailTerm', {
        emailTerm: `%${params.searchEmailTerm}%`,
      });
    }

    //const sortBy = params.sortBy ?? 'createdAt'; нормальная иньекция спросить ?

    const allowedSortBy = ['id', 'login', 'email', 'createdAt'];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const stringField = ['login', 'email'];
    if (stringField.includes(sortBy)) {
      queryBuilder.orderBy(`u.${sortBy} COLLATE "C"`, sortDirection);
    } else {
      queryBuilder.orderBy(`u.${sortBy}`, sortDirection);
    }

    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.skip(offset).take(limit);

    const [users, totalCount] = await queryBuilder.getManyAndCount();
    return UsersViewPaginated.mapToView({
      items: users.map((u) => UserViewModel.mapToView(u)),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getUserByIdOrError(id: string): Promise<UserViewModel> {
    const user = await this.usersTypeOrmRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return UserViewModel.mapToView(user);
  }
}
