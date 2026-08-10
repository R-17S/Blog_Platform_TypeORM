import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlogEntity } from '../../blogs/domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { LikeStatusTypes } from '../api/view-dto/posts.view-dto';

@Entity({ name: 'Posts' })
@Index(['blogId', 'createdAt'])
@Index(['createdAt'])
@Index(['likesCount'])
export class PostEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'character varying', length: 128 })
  title: string;

  @Column({ type: 'character varying', length: 500 })
  shortDescription: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  blogId: string;

  @ManyToOne(() => BlogEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: BlogEntity;

  @Column({ type: 'integer', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  dislikesCount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;

  static create(input: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
  }): PostEntity {
    const post = new PostEntity();
    post.id = crypto.randomUUID();
    post.title = input.title;
    post.shortDescription = input.shortDescription;
    post.content = input.content;
    post.blogId = input.blogId;
    post.likesCount = 0;
    post.dislikesCount = 0;
    return post;
  }

  update(input: {
    title: string;
    shortDescription: string;
    content: string;
  }): void {
    this.title = input.title;
    this.shortDescription = input.shortDescription;
    this.content = input.content;
  }

  checkBelongsToBlogOrError(blogId: string): void {
    if (this.blogId !== blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found for this blog',
      });
    }
  }

  updateLikeStatus(
    oldStatus: LikeStatusTypes,
    newStatus: LikeStatusTypes,
  ): void {
    if (oldStatus === newStatus) return;

    // Отменяем старый статус
    if (oldStatus === LikeStatusTypes.Like) {
      this.likesCount = Math.max(0, this.likesCount - 1);
    }
    if (oldStatus === LikeStatusTypes.Dislike) {
      this.dislikesCount = Math.max(0, this.dislikesCount - 1);
    }

    // Применяем новый статус
    if (newStatus === LikeStatusTypes.Like) {
      this.likesCount++;
    }
    if (newStatus === LikeStatusTypes.Dislike) {
      this.dislikesCount++;
    }
  }
}
