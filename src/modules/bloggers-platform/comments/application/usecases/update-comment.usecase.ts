import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { CommentEntity } from '../../domain/comment.entity';

export class UpdateCommentCommand {
  constructor(
    public readonly id: string,
    public readonly input: UpdateCommentDto,
    public readonly userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({ id, input, userId }: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    comment.checkOwnerOrError(userId);
    comment.updateContent(input.content);
    await this.commentsRepository.save(comment);
  }
}
