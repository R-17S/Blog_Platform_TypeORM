import { Injectable } from '@nestjs/common';
import { MeViewDto } from '../../api/view-dto/users.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserEntity } from '../../domain/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly authQueryRepository: Repository<UserEntity>,
  ) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.authQueryRepository.findOne({
      select: {
        id: true,
        email: true,
        login: true,
      },
      where: { id: userId },
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
      });
    }
    return MeViewDto.mapToView(user);
  }
}
