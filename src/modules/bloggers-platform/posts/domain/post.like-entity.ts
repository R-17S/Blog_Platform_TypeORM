import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LikeStatusTypes } from '../api/view-dto/posts.view-dto';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../../user-accounts/domain/user.entity';

@Entity({ name: 'PostLikes' })
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
}
