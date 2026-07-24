import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'Blogs' })
export class BlogEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'character varying', length: 64 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'character varying', length: 255 })
  websiteUrl: string;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
