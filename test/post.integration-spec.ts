import { INestApplication } from '@nestjs/common';
import { PostsRepository } from '../src/modules/bloggers-platform/posts/infrastructure/posts.repository';
import {
  CreateBlogCommand,
  CreateBlogUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/create-blog.usecase';
import { CommentsRepository } from '../src/modules/bloggers-platform/comments/infrastructure/comments.repository';
import { PostLikesRepository } from '../src/modules/bloggers-platform/posts/infrastructure/post-likes.repository';
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
import { TestingService } from '../src/modules/testing/ application/testing.service';
import { PostEntity } from '../src/modules/bloggers-platform/posts/domain/post.entity';

describe('posts', () => {
  let app: INestApplication;
  let usersTestManager: UsersTestManager;
  let postsRepository: PostsRepository;
  let commentsRepository: CommentsRepository;
  let postLikesRepository: PostLikesRepository;
  let createBlogUseCase: CreateBlogUseCase;
  let createCommentUseCase: CreateCommentUseCase;
  let usersRepository: UsersRepository;
  let updatePostLikeStatusUseCase: UpdatePostLikeStatusUseCase;
  let testingService: TestingService;


  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    usersTestManager = result.userTestManager;
    postsRepository = app.get(PostsRepository);
    commentsRepository = app.get(CommentsRepository);
    postLikesRepository = app.get(PostLikesRepository);
    createBlogUseCase = app.get(CreateBlogUseCase);
    createCommentUseCase = app.get(CreateCommentUseCase);
    usersRepository = app.get(UsersRepository);
    updatePostLikeStatusUseCase = app.get(UpdatePostLikeStatusUseCase);
    testingService = app.get(TestingService);
  });
  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await testingService.clearDatabase();
  });

  it('should successfully create a comment for a post', async () => {
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

    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;

    const command = new CreateCommentCommand(
      { content: 'This is a very nice post!' },
      postId,
      userId,
      userLogin,
    );

    const commentId = await createCommentUseCase.execute(command);

    expect(commentId).toBeDefined();

    const commentInDb = await commentsRepository.findById(commentId);
    expect(commentInDb).not.toBeNull();
    expect(commentInDb!.content).toBe('This is a very nice post!');
  });

  it('короче полный цикл лайка (Create -> Update -> Delete)', async () => {
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
    await usersTestManager.createAndLoginSingleUser();
    const user = await usersRepository.findByLogin('name1');
    if (!user) {
      throw new Error('Not Found User in Db');
    }
    const userId = user.id;
    const userLogin = user.login;

    // СЦЕНАРИЙ 1: Пользователь ставит Like впервые (Создание)
    await updatePostLikeStatusUseCase.execute(
      new UpdatePostLikeStatusCommand(
        postId,
        userId,
        userLogin,
        LikeStatusTypes.Like,
      ),
    );
    const postLike = await postLikesRepository.findByPostAndUser(
      postId,
      userId,
    );
    expect(postLike).not.toBeNull();
    expect(postLike!.status).toBe(LikeStatusTypes.Like);

    // СЦЕНАРИЙ 2: Пользователь меняет статус на Dislike
    await updatePostLikeStatusUseCase.execute(
      new UpdatePostLikeStatusCommand(
        postId,
        userId,
        userLogin,
        LikeStatusTypes.Dislike,
      ),
    );
    const postLike2 = await postLikesRepository.findByPostAndUser(
      postId,
      userId,
    );
    expect(postLike2).not.toBeNull();
    expect(postLike2!.status).toBe(LikeStatusTypes.Dislike);

    // СЦЕНАРИЙ 3: Пользователь даляет статус
    await updatePostLikeStatusUseCase.execute(
      new UpdatePostLikeStatusCommand(
        postId,
        userId,
        userLogin,
        LikeStatusTypes.None,
      ),
    );
    const postLike3 = await postLikesRepository.findByPostAndUser(
      postId,
      userId,
    );
    expect(postLike3).toBeNull();
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
});
