import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { QuestionEntity } from '../domain/questionEntity';

export class CreateQuestionCommand {
  constructor(
    public readonly body: string,
    public readonly correctAnswers: string[],
  ) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand, string>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}
  async execute(command: CreateQuestionCommand): Promise<string> {
    const newQuestion = QuestionEntity.create(
      command.body,
      command.correctAnswers,
    );
    await this.questionsRepository.save(newQuestion);
    return newQuestion.id;
  }
}
