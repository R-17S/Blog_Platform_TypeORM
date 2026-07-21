import { CreateBlogDto } from '../../dto/create-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogEntity } from '../../domain/blog.entity';
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
    const newBlog = new BlogEntity();
    newBlog.id = crypto.randomUUID();
    newBlog.name = input.name;
    newBlog.description = input.description;
    newBlog.websiteUrl = input.websiteUrl;
    newBlog.isMembership = false;

    await this.blogsRepository.save(newBlog);
    return newBlog.id;
  }
}
