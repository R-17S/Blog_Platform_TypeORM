import { CreateBlogDto } from '../../dto/create-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogSqlEntity } from '../../domain/blog.entity';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class CreateBlogCommand {
  constructor(public readonly input: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute({ input }: CreateBlogCommand): Promise<string> {
    const blog = new BlogSqlEntity();
    blog.id = crypto.randomUUID();
    blog.name = input.name;
    blog.description = input.description;
    blog.websiteUrl = input.websiteUrl;
    blog.isMembership = false;

    await this.blogsRepository.createBlog(blog);
    return blog.id;
  }
}
