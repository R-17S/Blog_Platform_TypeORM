import { QuestionEntity } from '../../domain/questionEntity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

export class QuestionViewModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;

  static mapToView(question: QuestionEntity): QuestionViewModel {
    return {
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt
        ? question.updatedAt.toISOString()
        : question.createdAt.toISOString(),
    };
  }
}

export class QuestionViewPaginated extends PaginatedViewDto<
  QuestionViewModel[]
> {
  //items: QuestionViewModel[];
}
