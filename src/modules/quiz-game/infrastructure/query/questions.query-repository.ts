import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionEntity } from '../../domain/question.entity';
import { Repository } from 'typeorm';
import {
  PublishedStatus,
  QuestionsInputQuery,
} from '../../api/query-dto/get-questions-query-params.input-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import {
  QuestionDomainViewModel,
  QuestionViewPaginated,
} from '../../api/view-dto/questions.view-dto';

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questQueryRepository: Repository<QuestionEntity>,
  ) {}

  async getAllQuestions(
    params: QuestionsInputQuery,
  ): Promise<QuestionViewPaginated> {
    const queryBuilder = this.questQueryRepository.createQueryBuilder('q');
    if (params.bodySearchTerm) {
      queryBuilder.andWhere('q.body ILIKE :bodySearchTerm', {
        bodySearchTerm: `%${params.bodySearchTerm}%`,
      });
    }

    if (params.publishedStatus === PublishedStatus.PUBLISHED) {
      queryBuilder.andWhere('q.published = true');
    } else if (params.publishedStatus === PublishedStatus.NOT_PUBLISHED) {
      queryBuilder.andWhere('q.published = false');
    }

    const allowedSortBy = ['id', 'body', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    if (sortBy === 'body') {
      queryBuilder.orderBy(`q.${sortBy} COLLATE "C"`, sortDirection);
    } else {
      queryBuilder.orderBy(`q.${sortBy}`, sortDirection);
    }
    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.skip(offset).take(limit);

    const [quests, totalCount] = await queryBuilder.getManyAndCount();
    return QuestionViewPaginated.mapToView({
      items: quests.map((quest) => QuestionDomainViewModel.mapToView(quest)),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }
}
