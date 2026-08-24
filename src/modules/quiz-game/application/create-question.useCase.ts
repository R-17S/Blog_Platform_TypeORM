import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { QuestionEntity } from '../domain/question.entity';
import { QuestionDomainViewModel } from '../api/view-dto/questions.view-dto';

export class CreateQuestionCommand {
  constructor(
    public readonly body: string,
    public readonly correctAnswers: string[],
  ) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand, QuestionDomainViewModel>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}
  async execute(
    command: CreateQuestionCommand,
  ): Promise<QuestionDomainViewModel> {
    const newQuestion = QuestionEntity.create(
      command.body,
      command.correctAnswers,
    );
    const savedQuestion = await this.questionsRepository.save(newQuestion);
    return QuestionDomainViewModel.mapToView(savedQuestion);
  }
}
