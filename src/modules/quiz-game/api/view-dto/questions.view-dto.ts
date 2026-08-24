import { QuestionEntity } from '../../domain/question.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

export class QuestionDomainViewModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string | null;

  static mapToView(question: QuestionEntity): QuestionDomainViewModel {
    return {
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt ? question.updatedAt.toISOString() : null,
    };
  }
}

export class QuestionViewPaginated extends PaginatedViewDto<
  QuestionDomainViewModel[]
> {
  //items: QuestionViewModel[];
}
