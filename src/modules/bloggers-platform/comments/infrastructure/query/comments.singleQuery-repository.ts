import { Injectable } from '@nestjs/common';
import { CommentEntity } from '../../domain/comment.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CommentsViewPaginated,
  CommentViewModel,
  LikeStatusTypes,
  RawCommentSingleQueryResult,
} from '../../api/view-dto/comments.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentInputQuery } from '../../api/input-dto/get-comments-query-params.input-dto';
import { CommentLikeEntity } from '../../domain/commentLike.entity';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsTypeOrmRepository: Repository<CommentEntity>,
    private readonly postsRepository: PostsRepository,
  ) {}

  async getCommentByIdOrErrorSingleQuery(
    id: string,
    userId?: string,
  ): Promise<CommentViewModel> {
    const queryBuilder = this.createBaseCommentQueryBuilder(userId).where(
      'c.id = :id',
      { id },
    );

    const raw = await queryBuilder.getRawOne<RawCommentSingleQueryResult>();

    if (!raw) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return this.mapRawToViewModel(raw);
  }

  async getCommentsByPostIdSingleQuery(
    postId: string,
    params: CommentInputQuery,
    userId?: string,
  ): Promise<CommentsViewPaginated> {
    await this.postsRepository.checkPostExistsOrError(postId);
    const totalCount = await this.commentsTypeOrmRepository.count({
      where: { postId },
    });

    const queryBuilder = this.createBaseCommentQueryBuilder(userId).where(
      'c.postId = :postId',
      { postId },
    );
    this.applySortingAndPagination(queryBuilder, params);
    const rawItems =
      await queryBuilder.getRawMany<RawCommentSingleQueryResult>();
    const items = rawItems.map((raw) => this.mapRawToViewModel(raw));

    return CommentsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  private createBaseCommentQueryBuilder(
    userId?: string,
  ): SelectQueryBuilder<CommentEntity> {
    return (
      this.commentsTypeOrmRepository
        .createQueryBuilder('c')
        .leftJoin('c.user', 'user')
        .select([
          'c.id AS id',
          'c.postId AS "postId"',
          'c.content AS content',
          'c.userId AS "userId"',
          'user.login AS "userLogin"',
          'c.likesCount AS "likesCount"',
          'c.dislikesCount AS "dislikesCount"',
          'c.createdAt AS "createdAt"',
        ])
        // Подзапрос для myStatus текущего пользователя
        .addSelect((subQuery) => {
          return subQuery
            .select('cl.status', 'myStatus')
            .from(CommentLikeEntity, 'cl')
            .where('cl.commentId = c.id')
            .andWhere('cl.userId = :userId', { userId: userId ?? null });
        }, 'myStatus')
    );
  }

  private applySortingAndPagination(
    queryBuilder: SelectQueryBuilder<CommentEntity>,
    params: CommentInputQuery,
  ): void {
    const allowedSortBy = [
      'id',
      'content',
      'createdAt',
      'userId',
      'likesCount',
      'dislikesCount',
      'userLogin',
    ];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const sortField = sortBy === 'userLogin' ? 'user.login' : `c.${sortBy}`;
    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.orderBy(`${sortField}`, sortDirection);
    queryBuilder.offset(offset).limit(limit);
  }

  private mapRawToViewModel(
    raw: RawCommentSingleQueryResult,
  ): CommentViewModel {
    return CommentViewModel.mapToView(
      raw,
      raw.myStatus ?? LikeStatusTypes.None,
      Number(raw.likesCount),
      Number(raw.dislikesCount),
    );
  }
}
