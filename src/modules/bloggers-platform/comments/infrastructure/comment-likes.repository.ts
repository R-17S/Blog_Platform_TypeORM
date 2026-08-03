import { Injectable } from '@nestjs/common';
import { CommentLikeEntity } from '../domain/commentLike.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentLikesRepository {
  constructor(
    @InjectRepository(CommentLikeEntity)
    private readonly commentLikesTypeOrmRepository: Repository<CommentLikeEntity>,
  ) {}

  async findByCommentAndUser(
    commentId: string,
    userId: string,
  ): Promise<CommentLikeEntity | null> {
    return await this.commentLikesTypeOrmRepository.findOne({
      where: { commentId, userId },
    });
  }

  async save(commentLike: CommentLikeEntity): Promise<void> {
    await this.commentLikesTypeOrmRepository.save(commentLike);
  }

  async deleteLike(commentId: string, userId: string): Promise<void> {
    await this.commentLikesTypeOrmRepository.delete({ commentId, userId });
  }
}