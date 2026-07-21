import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostEntity } from '../../domain/post.entity';

export enum LikeStatusTypes {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export type PostWithBlogNameSqlEntity = PostEntity & {
  blogName: string;
};
export class PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusTypes;
    newestLikes: Array<{
      addedAt: Date;
      userId: string;
      login: string;
    }>;
  };

  static mapToView(
    post: PostWithBlogNameSqlEntity,
    myStatus: LikeStatusTypes,
    newestLikes: Array<{ addedAt: Date; userId: string; login: string }>,
    likesCount: number,
    dislikesCount: number,
  ): PostViewModel {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: new Date(post.createdAt),
      extendedLikesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
        newestLikes,
      },
    };
  }
}

export class PostsViewPaginated extends PaginatedViewDto<PostViewModel[]> {
  //items: PostViewModel[];
}
