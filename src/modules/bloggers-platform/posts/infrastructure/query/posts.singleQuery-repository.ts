import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../../domain/post.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PostInputQuery } from '../../api/input-dto/get-posts-query-params.input-dto';
import {
  LikeStatusTypes,
  PostsViewPaginated,
  PostViewModel,
  RawPostSingleQueryResult,
} from '../../api/view-dto/posts.view-dto';
import { PostLikesEntity } from '../../domain/postLike.entity';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsTypeOrmRepository: Repository<PostEntity>,
    private readonly blogsRepository: BlogsRepository,
  ) {}
  async getAllPostsSingleQuery(
    params: PostInputQuery,
    userId?: string,
  ): Promise<PostsViewPaginated> {
    const totalCount = await this.postsTypeOrmRepository.count();
    const queryBuilder = this.createBasePostQueryBuilder(userId);
    this.applySortingAndPagination(queryBuilder, params);
    const rawItems = await queryBuilder.getRawMany<RawPostSingleQueryResult>();
    const items = rawItems.map((raw) => this.mapRawToViewModel(raw));
    return PostsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getPostsByBlogIdSingleQuery(
    id: string,
    params: PostInputQuery,
    userId?: string,
  ): Promise<PostsViewPaginated> {
    await this.blogsRepository.checkBlogExistsOrError(id);
    const totalCount = await this.postsTypeOrmRepository.count({
      where: { blogId: id },
    });
    const queryBuilder = this.createBasePostQueryBuilder(userId).where(
      'p.blogId = :blogId',
      { blogId: id },
    );
    this.applySortingAndPagination(queryBuilder, params);
    const rawItems = await queryBuilder.getRawMany<RawPostSingleQueryResult>();
    const items = rawItems.map((raw) => this.mapRawToViewModel(raw));

    return PostsViewPaginated.mapToView({
      items,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getPostByIdOrErrorSingleQuery(
    id: string,
    userId?: string,
  ): Promise<PostViewModel> {
    const queryBuilder = this.createBasePostQueryBuilder(userId).where(
      'p.id = :id',
      { id },
    );

    // 💡 .getRawOne() возвращает 1 сырой объект или undefined/null, если пост не найден
    const raw = await queryBuilder.getRawOne<RawPostSingleQueryResult>();

    if (!raw) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return this.mapRawToViewModel(raw);
  }

  private createBasePostQueryBuilder(
    userId?: string,
  ): SelectQueryBuilder<PostEntity> {
    return (
      this.postsTypeOrmRepository
        .createQueryBuilder('p')
        .leftJoin('p.blog', 'blog')
        .select([
          'p.id AS id',
          'p.title AS title',
          'p.shortDescription AS "shortDescription"',
          'p.content AS content',
          'p.blogId AS "blogId"',
          'blog.name AS "blogName"',
          'p.likesCount AS "likesCount"',
          'p.dislikesCount AS "dislikesCount"',
          'p.createdAt AS "createdAt"',
        ])
        // A) Подзапрос для myStatus
        .addSelect((subQuery) => {
          return subQuery
            .select('pl.status', 'myStatus')
            .from(PostLikesEntity, 'pl')
            .where('pl.postId = p.id')
            .andWhere('pl.userId = :userId', { userId: userId ?? null });
        }, 'myStatus')
        // B) Подзапрос для newestLikes (топ-3 свежих лайка в JSON)
        .addSelect(
          `
        COALESCE((
          SELECT jsonb_agg(
            json_build_object(
              'addedAt', top_likes."createdAt",
              'userId', top_likes."userId",
              'login', u.login
            ) ORDER BY top_likes."createdAt" DESC
          )
          FROM (
            SELECT pl_sub."userId", pl_sub."createdAt"
            FROM "PostLikes" pl_sub
            WHERE pl_sub."postId" = p.id AND pl_sub.status = 'Like'
            ORDER BY pl_sub."createdAt" DESC
            LIMIT 3
          ) top_likes
          INNER JOIN "Users" u ON u.id = top_likes."userId"
        ), '[]'::jsonb)
      `,
          'newestLikes',
        )
    );
  }

  private applySortingAndPagination(
    queryBuilder: SelectQueryBuilder<PostEntity>,
    params: PostInputQuery,
  ): void {
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

    queryBuilder.orderBy(sortField, sortDirection);
    queryBuilder.offset(offset).limit(limit);
  }

  private mapRawToViewModel(raw: RawPostSingleQueryResult): PostViewModel {
    return PostViewModel.mapToView(
      raw,
      raw.myStatus ?? LikeStatusTypes.None,
      raw.newestLikes ?? [],
      Number(raw.likesCount),
      Number(raw.dislikesCount),
    );
  }
}
