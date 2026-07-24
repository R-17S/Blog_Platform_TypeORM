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

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
  deletedAt: Date | null;
}