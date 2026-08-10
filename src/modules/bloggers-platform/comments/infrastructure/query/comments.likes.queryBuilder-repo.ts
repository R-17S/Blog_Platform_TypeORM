import { CommentLikeEntity } from '../../domain/commentLike.entity';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LikeStatusTypes } from '../../api/view-dto/comments.view-dto';

@Injectable()
export class CommentsQueryBuilderRepo {
  constructor(
    @InjectRepository(CommentLikeEntity)
    private readonly queryBuilderRepo: Repository<CommentLikeEntity>,
  ) {}

  async getStatusesForComments(
    userId: string,
    commentIds: string[],
  ): Promise<Record<string, LikeStatusTypes>> {
    if (commentIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('clqb')
      .select(['clqb.commentId', 'clqb.status'])
      .where('clqb.userId = :userId', { userId: userId })
      .andWhere('clqb.commentId IN (:...commentIds)', { commentIds })
      .getMany();

    const map: Record<string, LikeStatusTypes> = {};
    for (const row of rows) {
      map[row.commentId] = row.status as LikeStatusTypes;
    }
    return map;
  }

  async getLikesCountForComments(commentIds: string[]){
    if (commentIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('clqb')
      .select(['clqb.commentId', 'clqb.status'])
      .addSelect('COUNT(*)', 'count')
      .where('clqb.commentId IN (:...commentIds)', { commentIds })
      .andWhere('clqb.status = :status', { status: 'Like' })
      .groupBy('clqb.commentId')
      .getRawMany<{ commentId: string; count: string }>();

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.commentId] = Number(row.count);
    }
    return map;
  }

  async getDislikesCountForComments(commentIds: string[]) {
    if (commentIds.length === 0) return {};

    const rows = await this.queryBuilderRepo
      .createQueryBuilder('clqb')
      .select(['clqb.commentId', 'clqb.status'])
      .addSelect('COUNT(*)', 'count')
      .where('clqb.commentId IN (:...commentIds)', { commentIds })
      .andWhere('clqb.status = :status', { status: 'Dislike' })
      .groupBy('clqb.commentId')
      .getRawMany<{ commentId: string; count: number }>();

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.commentId] = Number(row.count);
    }
    return map;
  }
}
