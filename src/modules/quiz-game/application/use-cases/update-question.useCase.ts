import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class UpdateQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly body: string,
    public readonly correctAnswers: string[],
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<void> {
    const question = await this.questionsRepository.findById(command.id);
    if (!question)
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });

    question.update(command.body, command.correctAnswers);
    await this.questionsRepository.save(question);
  }
}
