import { LikeStatusTypes } from '../../api/view-dto/comments.view-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentLikesRepository } from '../../infrastructure/comment-likes.repository';
import { CommentLikeEntity } from '../../domain/commentLike.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentLikeStatusCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly userLogin: string,
    public readonly likeStatus: LikeStatusTypes,
  ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase
  implements ICommandHandler<UpdateCommentLikeStatusCommand, void>
{
  constructor(
    private readonly commentLikesRepository: CommentLikesRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({
    commentId,
    userId,
    likeStatus,
  }: UpdateCommentLikeStatusCommand): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    const existing = await this.commentLikesRepository.findByCommentAndUser(
      commentId,
      userId,
    );

    const oldStatus = existing
      ? (existing.status as LikeStatusTypes)
      : LikeStatusTypes.None;

    // 3. Если статус None → удаляем лайк
    if (likeStatus === LikeStatusTypes.None) {
      if (existing) {
        await this.commentLikesRepository.deleteLike(commentId, userId);
      }
    }

    if (existing) {
      existing.changeStatus(likeStatus);
      await this.commentLikesRepository.save(existing);
    } else {
      const newLike = CommentLikeEntity.create(commentId, userId, likeStatus);
      await this.commentLikesRepository.save(newLike);
    }
    comment.updateLikeStatus(oldStatus, likeStatus);
    await this.commentsRepository.save(comment);
  }
}
