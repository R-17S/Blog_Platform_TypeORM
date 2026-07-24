import { LikeStatusTypes } from '../../api/view-dto/comments.view-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentLikesRepository } from '../../infrastructure/comment-likes.repository';
import { CommentLikeEntity } from '../../domain/comment.like-entity';

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
    await this.commentsRepository.checkCommentExistsOrError(commentId);
    const existing = await this.commentLikesRepository.findByCommentAndUser(
      commentId,
      userId,
    );

    // 3. Если статус None → удаляем лайк
    if (likeStatus === LikeStatusTypes.None) {
      if (existing) {
        await this.commentLikesRepository.deleteLike(commentId, userId);
      }
      return;
    }

    const status = existing ?? new CommentLikeEntity();

    status.commentId = commentId;
    status.userId = userId;
    status.status = likeStatus;

    await this.commentLikesRepository.save(status);
  }
}
