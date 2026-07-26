import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';

export class DeleteUserCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}
  async execute({ userId }: DeleteUserCommand): Promise<void> {
    await this.usersRepository.checkUserExistsOrError(userId);
    await this.usersRepository.softDelete(userId);
  }
}
