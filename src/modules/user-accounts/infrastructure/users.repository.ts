import { Injectable } from '@nestjs/common';
import { UserEntity } from '../domain/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersTypeOrmRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return await this.usersTypeOrmRepository.findOne({
      where: { id },
    });
  }

  async save(user: UserEntity): Promise<void> {
    await this.usersTypeOrmRepository.save(user);
  }

  async findByLogin(login: string): Promise<UserEntity | null> {
    return this.usersTypeOrmRepository.findOne({
      where: { login },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersTypeOrmRepository.findOne({
      where: { email },
    });
  }

  async checkUserExistsOrError(id: string): Promise<void> {
    const exists = await this.usersTypeOrmRepository.exists({
      where: { id },
    });

    if (!exists) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }
  }

  async softDelete(userId: string): Promise<void> {
    await this.usersTypeOrmRepository.delete(userId);
  }

  async findByConfirmationCode(
    confirmationCode: string,
  ): Promise<UserEntity | null> {
    return this.usersTypeOrmRepository.findOne({
      where: { confirmationCode },
    });
  }

  async findByRecoveryCode(recoveryCode: string): Promise<UserEntity | null> {
    return this.usersTypeOrmRepository.findOne({
      where: { recoveryCode },
    });
  }
}
