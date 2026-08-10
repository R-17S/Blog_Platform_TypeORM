import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'Blogs' })
@Index(['createdAt'])
@Index(['name'])
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

  static create(input: {
    name: string;
    description: string;
    websiteUrl: string;
  }): BlogEntity {
    const blog = new BlogEntity();
    blog.id = crypto.randomUUID();
    blog.name = input.name;
    blog.description = input.description;
    blog.websiteUrl = input.websiteUrl;
    blog.isMembership = false;
    return blog;
  }

  update(input: {
    name: string;
    description: string;
    websiteUrl: string;
  }): void {
    this.name = input.name;
    this.description = input.description;
    this.websiteUrl = input.websiteUrl;
  }
}
