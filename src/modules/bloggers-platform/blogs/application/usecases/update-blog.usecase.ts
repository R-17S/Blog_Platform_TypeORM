import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateBlogDto } from '../../dto/update-blog.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateBlogCommand {
  constructor(
    public readonly id: string,
    public readonly input: UpdateBlogDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(
    private readonly blogsRepository: BlogsRepository,
  ) {}
  async execute({ id, input }: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findById(id);
    if (!blog)
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });

    // 2. Создаём обновлённый объект
    blog.name = input.name;
    blog.description = input.description;
    blog.websiteUrl = input.websiteUrl;

    // 3. Сохраняем
    await this.blogsRepository.save(blog);
  }
}
