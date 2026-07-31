import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';
import { RecoveryEmailRequestedEvent } from '../../../domain/events/recovery-email-requested.event';

export class PasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventBus: EventBus,
  ) {}
  async execute({ email }: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) return;

    const recoveryCode = randomUUID();
    const recoveryExpiration = add(new Date(), { hours: 24 });
    user.setRecoveryCode(recoveryCode, recoveryExpiration);
    await this.usersRepository.save(user);

    this.eventBus.publish(new RecoveryEmailRequestedEvent(email, recoveryCode));
  }
}
