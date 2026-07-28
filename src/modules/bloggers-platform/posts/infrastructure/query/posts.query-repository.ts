import { Injectable } from '@nestjs/common';
import { PostInputQuery } from '../../api/input-dto/get-posts-query-params.input-dto';
import {
  PostsViewPaginated,
  PostViewModel,
  PostWithBlogNameSqlEntity,
} from '../../api/view-dto/posts.view-dto';
import { PostLikesQueryRepository } from './posts.likes.query-repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../../domain/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsTypeOrmRepository: Repository<PostEntity>,
    private readonly postLikesQueryRepository: PostLikesQueryRepository,
  ) {}

  async getAllPosts(
    params: PostInputQuery,
    userId?: string,
  ): Promise<PostsViewPaginated> {
    const queryBuilder = this.postsTypeOrmRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.blog', 'blog');
    const allowedSortBy = [
      'id',
      'title',
      'shortDescription',
      'content',
      'likesCount',
      'dislikesCount',
      'createdAt',
      'blogName',
    ];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';

    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    let sortField = `p.${sortBy}`;
    if (sortBy === 'blogName') {
      sortField = 'blog.name';
    }
    queryBuilder.orderBy(sortField, sortDirection);
    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.skip(offset).take(limit);

    const [posts, totalCount] = await queryBuilder.getManyAndCount();

    const mappedPost: PostWithBlogNameSqlEntity[] = posts.map((p) => ({
      ...p,
      blogName: p.blog.name,
    }));

    const items = await this.postLikesQueryRepository.enrichPostsWithLikes(
      mappedPost,
      userId,
    );

    return PostsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getPostByIdOrError(
    id: string,
    userId?: string,
  ): Promise<PostViewModel> {
    const post = await this.postsTypeOrmRepository.findOne({
      where: { id },
      relations: { blog: true },
    });
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    const mappedPost: PostWithBlogNameSqlEntity = {
      ...post,
      blogName: post.blog.name,
    };
    const items = await this.postLikesQueryRepository.enrichPostsWithLikes(
      [mappedPost],
      userId,
    );
    return items[0];
  }

  async getPostsByBlogId(
    id: string,
    params: PostInputQuery,
    userId?: string,
  ): Promise<PostsViewPaginated> {
    const queryBuilder = this.postsTypeOrmRepository.createQueryBuilder('p');
    queryBuilder.leftJoinAndSelect('p.blog', 'blog');
    queryBuilder.where('p.blogId = :blogId', { blogId: id });

    const allowedSortBy = [
      'id',
      'title',
      'shortDescription',
      'content',
      'likesCount',
      'dislikesCount',
      'createdAt',
      'blogName',
    ];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';

    const sortField = sortBy === 'blogName' ? 'blog.name' : `p.${sortBy}`;

    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const offset = params.calculateSkip();
    const limit = params.pageSize;
    queryBuilder.orderBy(`${sortField}`, sortDirection);
    queryBuilder.skip(offset).take(limit);
    const [posts, totalCount] = await queryBuilder.getManyAndCount();

    const mappedPost: PostWithBlogNameSqlEntity[] = posts.map((p) => ({
      ...p,
      blogName: p.blog.name,
    }));

    const items = await this.postLikesQueryRepository.enrichPostsWithLikes(
      mappedPost,
      userId,
    );

    return PostsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }
}
