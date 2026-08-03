import { LikeStatusTypes } from '../../posts/api/view-dto/posts.view-dto';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommentEntity } from './comment.entity';
import { UserEntity } from '../../../user-accounts/domain/user.entity';

@Entity({ name: 'CommentLikes' })
export class CommentLikeEntity {
  @PrimaryColumn({ type: 'uuid' })
  commentId: string;

  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => CommentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: CommentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({
    type: 'character varying',
    length: 10,
    default: LikeStatusTypes.None,
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  static create(
    commentId: string,
    userId: string,
    status: string,
  ): CommentLikeEntity {
    const like = new CommentLikeEntity();
    like.commentId = commentId;
    like.userId = userId;
    like.status = status;
    return like;
  }


  changeStatus(newStatus: string): void {
    this.status = newStatus;
  }
}
