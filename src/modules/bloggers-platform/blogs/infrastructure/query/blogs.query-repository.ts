import {
  BlogsViewPaginated,
  BlogViewModel,
} from '../../api/view-dto/blogs.view-dto';
import { BlogInputQuery } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Injectable } from '@nestjs/common';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogSqlEntity } from '../../domain/blog.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(BlogSqlEntity)
    private readonly blogsTypeOrmRepository: Repository<BlogSqlEntity>,
  ) {}

  async getAllBlogs(params: BlogInputQuery): Promise<BlogsViewPaginated> {
    // 1. Фильтр
    const queryBuilder = this.blogsTypeOrmRepository.createQueryBuilder('bqb');

    if (params.searchNameTerm) {
      queryBuilder.andWhere('b.name ILIKE :searchNameTerm', {
        searchNameTerm: `%${params.searchNameTerm}%`,
      });
    }

    const allowedSortBy = [
      'id',
      'name',
      'description',
      'websiteUrl',
      'createdAt',
      'isMembership',
    ];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const stringFields = ['name', 'description', 'websiteUrl'];
    if (stringFields.includes(sortBy)) {
      queryBuilder.orderBy(`bqb.${sortBy} COLLATE "C"`, sortDirection);
    } else {
      queryBuilder.orderBy(`bqb.${sortBy}`, sortDirection);
    }

    const offset = params.calculateSkip();
    const limit = params.pageSize;

    queryBuilder.skip(offset).take(limit);

    const [blogs, totalCount] = await queryBuilder.getManyAndCount();
    return BlogsViewPaginated.mapToView({
      items: blogs.map((blog) => BlogViewModel.mapToView(blog)),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getBlogByIdOrError(id: string): Promise<BlogViewModel> {
    const blog = await this.blogsTypeOrmRepository.findOne({
      where: { id },
    });
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }
    return BlogViewModel.mapToView(blog);
  }
}
