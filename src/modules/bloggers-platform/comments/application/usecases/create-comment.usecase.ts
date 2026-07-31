import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { CommentEntity } from '../../domain/comment.entity';

export class CreateCommentCommand {
  constructor(
    public readonly input: CreateCommentDto,
    public readonly postId: string,
    public readonly userId: string,
    public readonly userLogin: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({
    input,
    postId,
    userId,
  }: CreateCommentCommand): Promise<string> {
    await this.postsRepository.checkPostExistsOrError(postId);
    const comment = CommentEntity.create({
      postId,
      userId,
      content: input.content,
    });

    await this.commentsRepository.save(comment);
    return comment.id;
  }
}
