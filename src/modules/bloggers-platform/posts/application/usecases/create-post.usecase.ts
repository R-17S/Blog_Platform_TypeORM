import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostEntity } from '../../domain/post.entity';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';

export class CreatePostCommand {
  constructor(
    public readonly title: string,
    public readonly shortDescription: string,
    public readonly content: string,
    public readonly blogId: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<string> {
    const { title, shortDescription, content, blogId } = command;
    await this.blogsRepository.checkBlogExistsOrError(blogId);

    const newPost = new PostEntity();
    newPost.id = crypto.randomUUID();
    newPost.title = title;
    newPost.shortDescription = shortDescription;
    newPost.content = content;
    newPost.blogId = blogId;

    // 3. Сохраняем в базе
    await this.postsRepository.save(newPost);

    // 4. Возвращаем id
    return newPost.id;
  }
}
