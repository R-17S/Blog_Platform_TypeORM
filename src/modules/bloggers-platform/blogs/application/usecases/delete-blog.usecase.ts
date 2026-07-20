import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

export class DeleteBlogCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute({ id }: DeleteBlogCommand): Promise<void> {
    await this.blogsRepository.checkBlogExistsOrError(id);
    await this.blogsRepository.softDelete(id);
  }
}
