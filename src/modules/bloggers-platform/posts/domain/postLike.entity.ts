import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LikeStatusTypes } from '../api/view-dto/posts.view-dto';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../../user-accounts/domain/user.entity';

@Entity({ name: 'PostLikes' })
@Index(['postId', 'status', 'createdAt'])
export class PostLikesEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({
    type: 'character varying',
    length: 10,
    default: LikeStatusTypes.None,
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  static create(
    postId: string,
    userId: string,
    status: string,
  ): PostLikesEntity {
    const like = new PostLikesEntity();
    like.postId = postId;
    like.userId = userId;
    like.status = status;
    return like;
  }

  changeStatus(newStatus: string): void {
    this.status = newStatus;
  }
}
