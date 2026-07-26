import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class ConfirmRegistrationCommand {
  constructor(public readonly code: string) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class ConfirmRegistrationUseCase
  implements ICommandHandler<ConfirmRegistrationCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}
  async execute({ code }: ConfirmRegistrationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid confirmation code',
        extensions: [{ key: 'code', message: 'Invalid confirmation code' }],
      });
    }

    if (user.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email already confirmed',
        extensions: [{ key: 'email', message: 'Email already confirmed' }],
      });
    }

    if (
      user.confirmationExpiration &&
      user.confirmationExpiration < new Date()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired',
        extensions: [{ key: 'code', message: 'Confirmation code expired' }],
      });
    }

    user.confirmationCode = null;
    user.isConfirmed = true;
    user.confirmationExpiration = null;

    await this.usersRepository.save(user);
  }
}
