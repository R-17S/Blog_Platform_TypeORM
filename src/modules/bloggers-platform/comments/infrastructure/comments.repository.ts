import { Injectable } from '@nestjs/common';
import { CommentEntity } from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly CommentsTypeOrmRepository: Repository<CommentEntity>,
  ) {}

  async save(comment: CommentEntity): Promise<void> {
    await this.CommentsTypeOrmRepository.save(comment);
  }

  async findById(id: string): Promise<CommentEntity | null> {
    return this.CommentsTypeOrmRepository.findOne({
      where: { id },
    });
  }

  async checkCommentExistsOrError(id: string): Promise<void> {
    const exists = await this.CommentsTypeOrmRepository.exists({
      where: { id },
    });

    if (!exists) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.CommentsTypeOrmRepository.softDelete(id);
  }
}
