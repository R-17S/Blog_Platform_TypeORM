import { PostLikesEntity } from '../domain/post.like-entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostLikesRepository {
  constructor(
    @InjectRepository(PostLikesEntity)
    private readonly postLikesTypeOrmRepository: Repository<PostLikesEntity>,
  ) {}

  async save(postLike: PostLikesEntity): Promise<void> {
    await this.postLikesTypeOrmRepository.save(postLike);
  }

  async findByPostAndUser(
    postId: string,
    userId: string,
  ): Promise<PostLikesEntity | null> {
    return await this.postLikesTypeOrmRepository.findOne({
      where: { postId, userId },
    });
  }

  async deleteLike(postId: string, userId: string): Promise<void> {
    await this.postLikesTypeOrmRepository.delete({ postId, userId });
  }
}
