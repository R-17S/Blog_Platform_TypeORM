import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdatePostByBlogIdDto } from '../../../posts/dto/update-postByBlogId.dto';

export class UpdatePostByBlogIdCommand {
  constructor(
    public readonly blogId: string,
    public readonly postId: string,
    public readonly input: UpdatePostByBlogIdDto,
  ) {}
}

@CommandHandler(UpdatePostByBlogIdCommand)
export class UpdatePostByBlogIdUseCase
  implements ICommandHandler<UpdatePostByBlogIdCommand, void>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute({
    blogId,
    postId,
    input,
  }: UpdatePostByBlogIdCommand): Promise<void> {
    await this.blogsRepository.checkBlogExistsOrError(blogId);
    // 1. Загружаем пост
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    post.checkBelongsToBlogOrError(blogId);
    post.update(input);
    await this.postsRepository.save(post);
  }
}
