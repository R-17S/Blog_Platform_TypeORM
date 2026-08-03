import { Injectable } from '@nestjs/common';
import { PostLikesEntity } from '../../domain/postLike.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeStatusTypes } from '../../api/view-dto/posts.view-dto';

@Injectable()
export class PostLikesQueryBuilderRepo {
  constructor(
    @InjectRepository(PostLikesEntity)
    private readonly queryBuilderRepo: Repository<PostLikesEntity>,
  ) {}

  async getStatusesForPosts(
    userId: string,
    postIds: string[],
  ): Promise<Record<string, LikeStatusTypes>> {
    if (postIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('plqb')
      .select(['plqb.postId', 'plqb.status'])
      .where('plqb.userId = :userId', { userId: userId })
      .andWhere('plqb.postId IN (:...postIds)', { postIds })
      .getMany();

    const map: Record<string, LikeStatusTypes> = {};
    for (const row of rows) {
      map[row.postId] = row.status as LikeStatusTypes;
    }
    return map;
  }

  async getLikesCountForPosts(postIds: string[]) {
    if (postIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('plqb')
      .select(['plqb.postId', 'plqb.status'])
      .addSelect('COUNT(*)', 'count')
      .where('plqb.postId IN (:...postIds)', { postIds })
      .andWhere('plqb.status = :status', { status: 'Like' })
      .groupBy('plqb.postId')
      .getRawMany<{ postId: string; count: string }>();

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.postId] = Number(row.count);
    }
    return map;
  }

  async getDislikesCountForPosts(postIds: string[]) {
    if (postIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('pl')
      .select('pl.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('pl.postId IN (:...postIds)', { postIds })
      .andWhere('pl.status = :status', { status: 'Dislike' })
      .groupBy('pl.postId')
      .getRawMany<{ postId: string; count: string }>();

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.postId] = Number(row.count);
    }
    return map;
  }
}
