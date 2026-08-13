import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export class PublishQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly published: boolean,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand, void>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: PublishQuestionCommand): Promise<void> {
    const question = await this.questionsRepository.findById(command.id);
    if (!question)
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });

    question.updatePublish(command.published);
    await this.questionsRepository.save(question);
  }
}
