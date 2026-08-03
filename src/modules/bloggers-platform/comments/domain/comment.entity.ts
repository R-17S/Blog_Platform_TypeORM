import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/domain/post.entity';
import { UserEntity } from '../../../user-accounts/domain/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { LikeStatusTypes } from '../api/view-dto/comments.view-dto';

@Entity({ name: 'Comments' })
export class CommentEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'integer', default: 0 })
  likesCount: number;

  @Column({ type: 'integer', default: 0 })
  dislikesCount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;

  static create(input: {
    postId: string;
    userId: string;
    content: string;
  }): CommentEntity {
    const comment = new CommentEntity();
    comment.id = crypto.randomUUID();
    comment.postId = input.postId;
    comment.userId = input.userId;
    comment.content = input.content;
    comment.likesCount = 0;
    comment.dislikesCount = 0;
    return comment;
  }

  updateContent(content: string): void {
    this.content = content;
  }

  checkOwnerOrError(userId: string): void {
    if (this.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You cannot edit this comment',
      });
    }
  }

  updateLikeStatus(
    oldStatus: LikeStatusTypes,
    newStatus: LikeStatusTypes,
  ): void {
    if (oldStatus === newStatus) return;

    // 1. Снимаем старый статус
    if (oldStatus === LikeStatusTypes.Like) {
      this.likesCount = Math.max(0, this.likesCount - 1);
    }
    if (oldStatus === LikeStatusTypes.Dislike) {
      this.dislikesCount = Math.max(0, this.dislikesCount - 1);
    }

    // 2. Навешиваем новый статус
    if (newStatus === LikeStatusTypes.Like) {
      this.likesCount++;
    }
    if (newStatus === LikeStatusTypes.Dislike) {
      this.dislikesCount++;
    }
  }
}
