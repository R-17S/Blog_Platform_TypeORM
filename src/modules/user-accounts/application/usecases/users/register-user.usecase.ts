import { CreateUserInputDto } from '../../../api/input-dto/users.input-dto';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { ArgonService } from '../../argon2.service';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { randomUUID } from 'node:crypto';
import { RegistrationEmailRequestedEvent } from '../../../domain/events/registration-email-requested.event';
import { add } from 'date-fns';
import { UserEntity } from '../../../domain/user.entity';

export class RegisterUserCommand {
  constructor(public readonly input: CreateUserInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly argonService: ArgonService,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ input }: RegisterUserCommand): Promise<void> {
    const [loginExists, emailExists] = await Promise.all([
      this.usersRepository.findByLogin(input.login),
      this.usersRepository.findByEmail(input.email),
    ]);

    if (loginExists)
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Login should be unique',
        extensions: [{ key: 'login', message: 'Login should be unique' }],
      });
    if (emailExists)
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email should be unique',
        extensions: [{ key: 'email', message: 'Email should be unique' }],
      });

    const passwordHash = await this.argonService.generateHash(input.password);
    const confirmationCode = randomUUID();

    const newUser = new UserEntity();
    newUser.id = randomUUID();
    newUser.login = input.login;
    newUser.email = input.email;
    newUser.passwordHash = passwordHash;
    newUser.confirmationCode = confirmationCode;
    newUser.confirmationExpiration = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
    newUser.isConfirmed = false;

    await this.usersRepository.save(newUser);
    this.eventBus.publish(
      new RegistrationEmailRequestedEvent(input.email, confirmationCode),
    );
  }
}
