import { INestApplication } from '@nestjs/common';
import { PostsRepository } from '../src/modules/bloggers-platform/posts/infrastructure/posts.repository';
import {
  CreateBlogCommand,
  CreateBlogUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/create-blog.usecase';
import { CommentsRepository } from '../src/modules/bloggers-platform/comments/infrastructure/comments.repository';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';

import {
  CreateCommentCommand,
  CreateCommentUseCase,
} from '../src/modules/bloggers-platform/comments/application/usecases/create-comment.usecase';
import { UsersRepository } from '../src/modules/user-accounts/infrastructure/users.repository';
import {
  UpdatePostLikeStatusCommand,
  UpdatePostLikeStatusUseCase,
} from '../src/modules/bloggers-platform/posts/application/usecases/update-post-like-status-use.case';
import { LikeStatusTypes } from '../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { DomainException } from '../src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../src/core/exceptions/domain-exception-codes';
import {
  UpdateCommentCommand,
  UpdateCommentUseCase,
} from '../src/modules/bloggers-platform/comments/application/usecases/update-comment.usecase';
import {
  UpdateCommentLikeStatusCommand,
  UpdateCommentLikeStatusUseCase,
} from '../src/modules/bloggers-platform/comments/application/usecases/update-comment-like-status.usecase';
import { CommentLikesRepository } from '../src/modules/bloggers-platform/comments/infrastructure/comment-likes.repository';
import { CreateUserDto } from '../src/modules/user-accounts/dto/create-user.dto';
import {
  DeleteCommentCommand,
  DeleteCommentUseCase,
} from '../src/modules/bloggers-platform/comments/application/usecases/delete-comment.usecase';
import { TestingService } from '../src/modules/testing/ application/testing.service';
import { PostEntity } from '../src/modules/bloggers-platform/posts/domain/post.entity';

describe('comments', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let postsRepository: PostsRepository;
  let commentsRepository: CommentsRepository;
  let createBlogUseCase: CreateBlogUseCase;
  let createCommentUseCase: CreateCommentUseCase;
  let usersRepository: UsersRepository;
  let updatePostLikeStatusUseCase: UpdatePostLikeStatusUseCase;
  let updateCommentUseCase: UpdateCommentUseCase;
  let updateCommentLikeStatusUseCase: UpdateCommentLikeStatusUseCase;
  let commentLikesRepository: CommentLikesRepository;
  let deleteCommentUseCase: DeleteCommentUseCase;
  let testingService: TestingService;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    usersTestManager = result.userTestManager;
    postsRepository = app.get(PostsRepository);
    commentsRepository = app.get(CommentsRepository);
    createBlogUseCase = app.get(CreateBlogUseCase);
    createCommentUseCase = app.get(CreateCommentUseCase);
    usersRepository = app.get(UsersRepository);
    updatePostLikeStatusUseCase = app.get(UpdatePostLikeStatusUseCase);
    updateCommentUseCase = app.get(UpdateCommentUseCase);
    updateCommentLikeStatusUseCase = app.get(UpdateCommentLikeStatusUseCase);
    commentLikesRepository = app.get(CommentLikesRepository);
    deleteCommentUseCase = app.get(DeleteCommentUseCase);
    testingService = app.get(TestingService);
  });
  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await testingService.clearDatabase();
  });

  async function seedBlogAndPost() {
    const dto = {
      name: 'test Blog',
      description: 'test description',
      websiteUrl: 'http://example.com/',
    };
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    const postId = crypto.randomUUID();
    const initialPost = new PostEntity();
    initialPost.id = postId;
    initialPost.title = 'title';
    initialPost.shortDescription = 'shortDesc';
    initialPost.content = 'content';
    initialPost.blogId = blogId;
    await postsRepository.save(initialPost);
    return postId;
  }

  it('should successfully update comment', async () => {
    const postId = await seedBlogAndPost();

    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;

    const comment = new CreateCommentCommand(
      { content: 'This is a very nice post!' },
      postId,
      userId,
      userLogin,
    );

    const commentId = await createCommentUseCase.execute(comment);

    await updateCommentUseCase.execute(
      new UpdateCommentCommand(
        commentId,
        { content: 'Update Comment' },
        userId,
      ),
    );
    const updateBlog = await commentsRepository.findById(commentId);
    expect(updateBlog?.content).toBe('Update Comment');
  });

  it('короче полный цикл лайка (Create -> Update -> Delete)', async () => {
    const postId = await seedBlogAndPost();
    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;

    const comment = new CreateCommentCommand(
      { content: 'This is a very nice post!' },
      postId,
      userId,
      userLogin,
    );

    const commentId = await createCommentUseCase.execute(comment);

    // СЦЕНАРИЙ 1: Пользователь ставит Like впервые (Создание)
    await updateCommentLikeStatusUseCase.execute(
      new UpdateCommentLikeStatusCommand(
        commentId,
        userId,
        userLogin,
        LikeStatusTypes.Like,
      ),
    );
    const commentLike = await commentLikesRepository.findByCommentAndUser(
      commentId,
      userId,
    );
    expect(commentLike).not.toBeNull();
    expect(commentLike!.status).toBe(LikeStatusTypes.Like);

    // СЦЕНАРИЙ 2: Пользователь меняет статус на Dislike
    await updateCommentLikeStatusUseCase.execute(
      new UpdateCommentLikeStatusCommand(
        commentId,
        userId,
        userLogin,
        LikeStatusTypes.Dislike,
      ),
    );
    const commentLike2 = await commentLikesRepository.findByCommentAndUser(
      commentId,
      userId,
    );
    expect(commentLike2).not.toBeNull();
    expect(commentLike2!.status).toBe(LikeStatusTypes.Dislike);

    // СЦЕНАРИЙ 3: Пользователь даляет статус
    await updateCommentLikeStatusUseCase.execute(
      new UpdateCommentLikeStatusCommand(
        commentId,
        userId,
        userLogin,
        LikeStatusTypes.None,
      ),
    );
    const commentLike3 = await commentLikesRepository.findByCommentAndUser(
      commentId,
      userId,
    );
    expect(commentLike3).toBeNull();
  });

  it('should (NotFound) when liking non-existent post', async () => {
    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;
    const postId = crypto.randomUUID();
    await expect(
      updatePostLikeStatusUseCase.execute(
        new UpdatePostLikeStatusCommand(
          postId,
          userId,
          userLogin,
          LikeStatusTypes.Like,
        ),
      ),
    ).rejects.toThrow(
      new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      }),
    );
  });

  it('should throw DomainException (Forbidden) if user is NOT the author of comment', async () => {
    const postId = await seedBlogAndPost();
    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const user_2 = await usersTestManager.createUser(body);
    const command = new CreateCommentCommand(
      { content: 'Original comment' },
      postId,
      userId,
      userLogin,
    );

    const commentId = await createCommentUseCase.execute(command);
    await expect(
      updateCommentUseCase.execute(
        new UpdateCommentCommand(
          commentId,
          { content: 'Hacked content' },
          user_2.id,
        ),
      ),
    ).rejects.toThrow(
      new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You cannot edit this comment',
      }),
    );
  });

  it('should successfully soft-delete comment', async () => {
    const postId = await seedBlogAndPost();
    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;
    const command = new CreateCommentCommand(
      { content: 'Original comment' },
      postId,
      userId,
      userLogin,
    );

    const commentId = await createCommentUseCase.execute(command);
    await deleteCommentUseCase.execute(
      new DeleteCommentCommand(commentId, userId),
    );
    const deleteComment = await commentsRepository.findById(commentId);
    expect(deleteComment).toBeNull();
  });
});
