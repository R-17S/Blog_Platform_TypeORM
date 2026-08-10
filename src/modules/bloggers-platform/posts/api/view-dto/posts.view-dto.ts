import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export enum LikeStatusTypes {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export interface RawPostSingleQueryResult extends PostWithBlogNameSqlEntity {
  myStatus: LikeStatusTypes;
  newestLikes: Array<{
    addedAt: Date;
    userId: string;
    login: string;
  }>;
}

export interface PostWithBlogNameSqlEntity {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
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
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
        newestLikes: (newestLikes ?? []).map((like) => ({
          addedAt: new Date(like.addedAt),
          userId: like.userId,
          login: like.login,
        })),
      },
    };
  }
}

export class PostsViewPaginated extends PaginatedViewDto<PostViewModel[]> {
  //items: PostViewModel[];
}
