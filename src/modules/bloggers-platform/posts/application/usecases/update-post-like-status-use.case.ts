import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostLikesEntity } from '../../domain/postLike.entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostLikesRepository } from '../../infrastructure/post-likes.repository';
import { LikeStatusTypes } from '../../api/view-dto/posts.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

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
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    const existing = await this.postLikesRepository.findByPostAndUser(
      postId,
      userId,
    );

    const oldStatus = existing
      ? (existing.status as LikeStatusTypes)
      : LikeStatusTypes.None;

    if (likeStatus === LikeStatusTypes.None) {
      if (existing) await this.postLikesRepository.deleteLike(postId, userId);
    }
    if (existing) {
      existing.changeStatus(likeStatus);
      await this.postLikesRepository.save(existing);
    } else {
      const newLike = PostLikesEntity.create(postId, userId, likeStatus);
      await this.postLikesRepository.save(newLike);
    }

    post.updateLikeStatus(oldStatus, likeStatus);
    await this.postsRepository.save(post);
  }
}
