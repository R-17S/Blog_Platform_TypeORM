import { Injectable } from '@nestjs/common';
import { PostEntity } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsTypeOrmRepository: Repository<PostEntity>,
  ) {}

  async save(post: PostEntity): Promise<void> {
    await this.postsTypeOrmRepository.save(post);
  }

  async findById(id: string): Promise<PostEntity | null> {
    return await this.postsTypeOrmRepository.findOne({
      where: { id },
    });
  }

  async checkPostExistsOrError(id: string): Promise<void> {
    const exists = await this.postsTypeOrmRepository.exists({
      where: { id },
    });

    if (!exists) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.postsTypeOrmRepository.softDelete(id);
  }

  // async findByBlogId(blogId: string): Promise<PostSqlEntity[]> {
  //   return await this.postsTypeOrmRepository.find({
  //     where: { blogId },
  //     order: { createdAt: 'DESC' },
  //   });
  // }
}
