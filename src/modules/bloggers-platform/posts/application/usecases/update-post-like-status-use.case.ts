import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostLikesEntity } from '../../domain/post.like-entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostLikesRepository } from '../../infrastructure/post-likes.repository';
import { LikeStatusTypes } from '../../api/view-dto/posts.view-dto';

export class UpdatePostLikeStatusCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly userLogin: string,
    public readonly likeStatus: LikeStatusTypes,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand, void>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}
  async execute({
    postId,
    userId,
    likeStatus,
  }: UpdatePostLikeStatusCommand): Promise<void> {
    await this.postsRepository.checkPostExistsOrError(postId);

    const existing = await this.postLikesRepository.findByPostAndUser(
      postId,
      userId,
    );

    if (likeStatus === LikeStatusTypes.None) {
      if (existing) await this.postLikesRepository.deleteLike(postId, userId);
      return;
    }
    const status = existing ?? new PostLikesEntity();

    status.postId = postId;
    status.userId = userId;
    status.status = likeStatus;

    await this.postLikesRepository.save(status);
  }
}
