import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { LikeStatusTypes } from '../api/view-dto/posts.view-dto';

@Entity({ name: 'PostLikes' })
export class PostLikesEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'uuid' })
  postId: string;

  @Column({
    type: 'character varying',
    length: 10,
    default: LikeStatusTypes.None,
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone', nullable: true })
  createdAt: string;
}
