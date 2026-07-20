import { Injectable } from '@nestjs/common';
import { BlogSqlEntity } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(BlogSqlEntity)
    private readonly blogsTypeOrmRepository: Repository<BlogSqlEntity>,
  ) {}

  async createBlog(blog: BlogSqlEntity): Promise<void> {
    const newBlog = this.blogsTypeOrmRepository.create(blog);
    await this.blogsTypeOrmRepository.save(newBlog);
  }

  async save(blog: BlogSqlEntity): Promise<void> {
    await this.blogsTypeOrmRepository.save(blog);
  }

  async updateBlog(blog: BlogSqlEntity): Promise<void> {
    await this.blogsTypeOrmRepository.update(blog.id, {
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
    });
  }

  async findById(id: string): Promise<BlogSqlEntity | null> {
    return await this.blogsTypeOrmRepository.findOne({
      where: { id },
    });
  }

  // async getBlogNameOrError(id: string): Promise<string> {
  //   const result = await this.blogsTypeOrmRepository.findOne({
  //     select: ['name'],
  //     where: { id },
  //   });
  //
  //   if (!result) {
  //     throw new DomainException({
  //       code: DomainExceptionCode.NotFound,
  //       message: 'Blog not found',
  //     });
  //   }
  //
  //   return result.name;
  // }

  async checkBlogExistsOrError(id: string): Promise<void> {
    const exists = await this.blogsTypeOrmRepository.exists({
      where: { id },
    });
    if (!exists) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.blogsTypeOrmRepository.softDelete(id);
  }

  async deleteAll(): Promise<void> {
    await this.blogsTypeOrmRepository.clear();
  }
}
