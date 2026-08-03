import { Injectable } from '@nestjs/common';
import {
  CommentsViewPaginated,
  CommentViewModel,
  CommentWithUserLoginSqlEntity,
  LikeStatusTypes,
} from '../../api/view-dto/comments.view-dto';
import { CommentLikesQueryRepository } from './comments.likes.query-repository';
import { CommentInputQuery } from '../../api/input-dto/get-comments-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { CommentEntity } from '../../domain/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsTypeOrmRepository: Repository<CommentEntity>,
    private readonly commentLikesQueryRepository: CommentLikesQueryRepository,
  ) {}

  async getCommentByIdOrError(
    id: string,
    userId?: string,
  ): Promise<CommentViewModel> {
    const comment = await this.commentsTypeOrmRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    const [likesMap, dislikesMap] = await Promise.all([
      this.commentLikesQueryRepository.getLikesCountForComments([id]),
      this.commentLikesQueryRepository.getDislikesCountForComments([id]),
    ]);

    const statusesMap = userId
      ? await this.commentLikesQueryRepository.getStatusesForComments(userId, [
          id,
        ])
      : {};

    const myStatus = statusesMap[id] ?? LikeStatusTypes.None;
    const likesCount = likesMap[id] ?? 0;
    const dislikesCount = dislikesMap[id] ?? 0;

    const mappedComment: CommentWithUserLoginSqlEntity = {
      ...comment,
      userLogin: comment.user.login,
    };

    return CommentViewModel.mapToView(
      mappedComment,
      myStatus,
      likesCount,
      dislikesCount,
    );
  }

  async getCommentsByPostId(
    postId: string,
    params: CommentInputQuery,
    userId?: string,
  ): Promise<CommentsViewPaginated> {
    const queryBuilder = this.commentsTypeOrmRepository.createQueryBuilder('c');
    queryBuilder.leftJoinAndSelect('c.user', 'user');
    queryBuilder.where('c.postId = :postId', { postId });
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

    let sortField = `c.${sortBy}`;
    if (sortBy === 'userLogin') {
      sortField = 'user.login';
    }
    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.orderBy(`${sortField}`, sortDirection);
    queryBuilder.skip(offset).take(limit);

    // 2. сами комментарии
    const [comments, totalCount] = await queryBuilder.getManyAndCount();
    const commentIds = comments.map((c) => c.id);

    // 3. лайки/дизлайки перенёс в модельку

    // 4. myStatus
    const statusesMap = userId
      ? await this.commentLikesQueryRepository.getStatusesForComments(
          userId,
          commentIds,
        )
      : {};

    const items = comments.map((comment) => {
      const mappedComment: CommentWithUserLoginSqlEntity = {
        ...comment,
        userLogin: comment.user.login,
      };

      // 5. маппинг
      return CommentViewModel.mapToView(
        mappedComment,
        statusesMap[comment.id] ?? LikeStatusTypes.None,
        comment.likesCount,
        comment.dislikesCount,
      );
    });

    return CommentsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }
}
