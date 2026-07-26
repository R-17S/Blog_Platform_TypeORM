import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ArgonService } from '../../argon2.service';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class NewPasswordCommand {
  constructor(
    public readonly newPassword: string,
    public readonly recoveryCode: string,
  ) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUserUseCase
  implements ICommandHandler<NewPasswordCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly argonService: ArgonService,
  ) {}
  async execute({
    newPassword,
    recoveryCode,
  }: NewPasswordCommand): Promise<void> {
    const user = await this.usersRepository.findByRecoveryCode(recoveryCode);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid recovery code',
        extensions: [{ key: 'code', message: 'Invalid recovery code' }],
      });
    }

    if (
      user.recoveryExpiration &&
      user.recoveryExpiration < new Date()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Recovery code expired',
        extensions: [{ key: 'code', message: 'Recovery code expired' }],
      });
    }

    const newHash = await this.argonService.generateHash(newPassword);
    user.passwordHash = newHash;
    user.recoveryCode = null;
    user.recoveryExpiration = null;
    await this.usersRepository.save(user);
  }
}
