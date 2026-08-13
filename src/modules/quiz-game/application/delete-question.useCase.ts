import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export class DeleteQuestionCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand, void>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}
  async execute(command: DeleteQuestionCommand): Promise<void> {
    const isDeleted = await this.questionsRepository.delete(command.id);
    if (!isDeleted)
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });
  }
}
