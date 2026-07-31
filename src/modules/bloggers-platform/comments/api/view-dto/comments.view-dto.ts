import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export enum LikeStatusTypes {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export interface CommentWithUserLoginSqlEntity {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userLogin: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusTypes;
  };

  static mapToView(
    comment: CommentWithUserLoginSqlEntity,
    myStatus: LikeStatusTypes,
    likesCount: number,
    dislikesCount: number,
  ): CommentViewModel {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
      },
    };
  }
}

export class CommentsViewPaginated extends PaginatedViewDto<
  CommentViewModel[]
> {
  //items: CommentViewModel[];
}
