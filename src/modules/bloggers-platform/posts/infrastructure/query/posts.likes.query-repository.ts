import { Injectable } from '@nestjs/common';
import { NewestLikeViewModel } from '../../dto/newest-like-view-model';
import {
  LikeStatusTypes,
  PostViewModel,
  PostWithBlogNameSqlEntity,
} from '../../api/view-dto/posts.view-dto';
import { PostLikesEntity } from '../../domain/post.like-scheme';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostLikesQueryRepository {
  constructor(
    @InjectRepository(PostLikesEntity)
    private readonly PostLikesQueryRepository: Repository<PostLikesEntity>,
  ) {}

  async getStatusesForPosts(
    userId: string,
    postIds: string[],
  ): Promise<Record<string, LikeStatusTypes>> {
    if (postIds.length === 0) return {};

    const result = await this.pool.query<{
      postId: string;
      status: LikeStatusTypes;
    }>(
      `
      SELECT "postId", "status"
      FROM "PostLikes"
      WHERE "userId" = $1 AND "postId" = ANY($2)
      `,
      [userId, postIds],
    );

    const map: Record<string, LikeStatusTypes> = {};
    for (const row of result.rows) {
      map[row.postId] = row.status;
    }
    return map;
  }

  async getNewestLikesForPosts(
    postIds: string[],
  ): Promise<Record<string, NewestLikeViewModel[]>> {
    if (postIds.length === 0) return {};

    const result = await this.pool.query<{
      postId: string;
      userId: string;
      userLogin: string;
      createdAt: string;
    }>(
      `
          SELECT pl."postId", pl."userId", u."login" AS "userLogin", pl."createdAt"
          FROM "PostLikes" pl
          INNER JOIN "Users" u ON pl."userId" = u.id
          WHERE pl."postId" = ANY($1) AND pl."status" = 'Like'
          ORDER BY pl."createdAt" DESC
      `,
      [postIds],
    );

    const map: Record<string, NewestLikeViewModel[]> = {};

    for (const row of result.rows) {
      if (!map[row.postId]) map[row.postId] = [];

      if (map[row.postId].length < 3) {
        map[row.postId].push({
          userId: row.userId,
          login: row.userLogin,
          addedAt: new Date(row.createdAt),
        });
      }
    }

    return map;
  }

  async getNewestLikesForPosts_CTE(
    postIds: string[],
  ): Promise<Record<string, NewestLikeViewModel[]>> {
    if (postIds.length === 0) return {};
    const result = await this.pool.query<{
      postId: string;
      userId: string;
      userLogin: string;
      createdAt: Date;
    }>(
      `
       WITH "RankedLikes" AS ( --создаём временную таблицу 
       SELECT
         pl."userId",
         pl."postId",
         u."login" AS "userLogin",
         pl."createdAt",
         ROW_NUMBER () OVER ( --Присваиваем каждому лайку порядковый номер (1, 2, 3...) внутри его группы
           PARTITION BY pl."postId" --оконная функция которая разбивет всю таблицу лайков на изолир группы по индификатору (postId)
           ORDER BY pl."createdAt" DESC
           --тут просто сортируем по свежести
           ) AS rn
         FROM "PostLikes" pl
         INNER JOIN "Users" u ON pl."userId" = u.id
         WHERE pl."postId" = ANY ($1) AND pl."status" = 'Like'
         )
       -- Забираем только те лайки, у которых порядковый номер (rn) в рамках поста меньше или равен 3
       SELECT "postId", "userId", "userLogin", "createdAt"
       FROM "RankedLikes"
       WHERE rn<=3 -- выбрасывает лишнее 
       ORDER BY "postId", "createdAt" DESC
       `,
      [postIds],
    );
    const map: Record<string, NewestLikeViewModel[]> = {};

    for (const row of result.rows) {
      if (!map[row.postId]) map[row.postId] = [];
      map[row.postId].push({
        userId: row.userId,
        login: row.userLogin,
        addedAt: new Date(row.createdAt),
      });
    }

    return map;
  }

  async getLikesCountForPosts(postIds: string[]) {
    if (postIds.length === 0) return {};

    const result = await this.pool.query<{ postId: string; count: string }>(
      `
      SELECT "postId", COUNT(*) AS count
      FROM "PostLikes"
      WHERE "postId" = ANY($1) AND "status" = 'Like'
      GROUP BY "postId"
      `,
      [postIds],
    );

    const map: Record<string, number> = {};
    for (const row of result.rows) {
      map[row.postId] = Number(row.count);
    }
    return map;
  }

  async getDislikesCountForPosts(postIds: string[]) {
    if (postIds.length === 0) return {};

    const result = await this.pool.query<{ postId: string; count: string }>(
      `
      SELECT "postId", COUNT(*) AS count
      FROM "PostLikes"
      WHERE "postId" = ANY($1) AND "status" = 'Dislike'
      GROUP BY "postId"
      `,
      [postIds],
    );

    const map: Record<string, number> = {};
    for (const row of result.rows) {
      map[row.postId] = Number(row.count);
    }
    return map;
  }

  async enrichPostsWithLikes(
    posts: PostWithBlogNameSqlEntity[],
    userId?: string,
  ): Promise<PostViewModel[]> {
    const postIds = posts.map((p) => p.id);

    const [statusesMap, newestLikesMap, likesCountMap, dislikesCountMap] =
      await Promise.all([
        userId ? this.getStatusesForPosts(userId, postIds) : {},
        this.getNewestLikesForPosts_CTE(postIds),
        this.getLikesCountForPosts(postIds),
        this.getDislikesCountForPosts(postIds),
      ]);

    return posts.map((post) =>
      PostViewModel.mapToView(
        post,
        statusesMap[post.id] ?? LikeStatusTypes.None,
        newestLikesMap[post.id] ?? [],
        likesCountMap[post.id] ?? 0,
        dislikesCountMap[post.id] ?? 0,
      ),
    );
  }
}
