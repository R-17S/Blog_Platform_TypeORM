import { Injectable } from '@nestjs/common';
import { LikeStatusTypes } from '../../api/view-dto/comments.view-dto';
import { CommentLikeEntity } from '../../domain/commentLike.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommentLikesQueryRepository {
  constructor(
    @InjectRepository(CommentLikeEntity)
    private readonly commentLikesRepository: Repository<CommentLikeEntity>,
  ) {}

  async getStatusesForComments(
    userId: string,
    commentIds: string[],
  ): Promise<Record<string, LikeStatusTypes>> {
    if (commentIds.length === 0) return {};

    const rows = await this.commentLikesRepository.query<
      {
        commentId: string;
        status: LikeStatusTypes;
      }[]
    >(
      `
      SELECT "commentId", "status"
      FROM "CommentLikes"
      WHERE "userId" = $1 AND "commentId" = ANY($2)
      `,
      [userId, commentIds],
    );

    const map: Record<string, LikeStatusTypes> = {};
    for (const row of rows) {
      map[row.commentId] = row.status;
    }
    return map;
  }

  async getLikesCountForComments(
    commentIds: string[],
  ): Promise<Record<string, number>> {
    if (commentIds.length === 0) return {};

    const result = await this.commentLikesRepository.query<
      {
        commentId: string;
        count: string;
      }[]
    >(
      `
      SELECT "commentId", COUNT(*) AS count
      FROM "CommentLikes"
      WHERE "commentId" = ANY($1) AND "status" = 'Like'
      GROUP BY "commentId"
      `,
      [commentIds],
    );

    const map: Record<string, number> = {};
    for (const row of result) {
      map[row.commentId] = Number(row.count);
    }
    return map;
  }

  async getDislikesCountForComments(
    commentIds: string[],
  ): Promise<Record<string, number>> {
    if (commentIds.length === 0) return {};

    const result = await this.commentLikesRepository.query<
      {
        commentId: string;
        count: string;
      }[]
    >(
      `
      SELECT "commentId", COUNT(*) AS count
      FROM "CommentLikes"
      WHERE "commentId" = ANY($1) AND "status" = 'Dislike'
      GROUP BY "commentId"
      `,
      [commentIds],
    );

    const map: Record<string, number> = {};
    for (const row of result) {
      map[row.commentId] = Number(row.count);
    }
    return map;
  }

  // async getNewestLikesForPosts(
  //   postIds: string[],
  // ): Promise<Record<string, NewestLikeViewModel[]>> {
  //   const likes = await this.likeModel.aggregate<AggregatedLikesResult>([
  //     { $match: { postId: { $in: postIds } } },
  //     { $sort: { createdAt: -1 } },
  //     { $group: { _id: '$postId', newest: { $push: '$$ROOT' } } }, // создаёт массив newest, куда складываются все документы этой группы. добавляет элемент в массив.$$ROOT — это специальная переменная, которая означает «весь текущий документ целиком»
  //   ]);
  //   const map: Record<string, NewestLikeViewModel[]> = {};
  //   for (const like of likes) {
  //     map[like._id] = like.newest.slice(0, 3).map((x) => ({
  //       userId: x.userId,
  //       login: x.login,
  //       addedAt: x.createdAt,
  //     }));
  //   }
  //   return map;
  // }

  // async enrichPostsWithLikes(
  //   posts: PostDocument[],
  //   userId?: string,
  // ): Promise<PostViewModel[]> {
  //   const postIds = posts.map((p) => p._id.toString());
  //
  //   const [statusesMap, newestLikesMap] = await Promise.all([
  //     userId ? this.getStatusesForPosts(userId, postIds) : {},
  //     this.getNewestLikesForPosts(postIds),
  //   ]);
  //
  //   return posts.map((post) =>
  //     PostViewModel.mapToView(
  //       post,
  //       statusesMap[post._id.toString()] ?? LikeStatusTypes.None,
  //       newestLikesMap[post._id.toString()] ?? [],
  //     ),
  //   );
  // }
}
