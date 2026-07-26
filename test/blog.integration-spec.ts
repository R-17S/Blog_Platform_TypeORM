import { INestApplication } from '@nestjs/common';
import { initSettings } from './helpers/init-settings';
import { BlogsRepository } from '../src/modules/bloggers-platform/blogs/infrastructure/blogs.repository';
import { PostsRepository } from '../src/modules/bloggers-platform/posts/infrastructure/posts.repository';
import {
  CreateBlogCommand,
  CreateBlogUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/create-blog.usecase';
import {
  UpdateBlogCommand,
  UpdateBlogUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/update-blog.usecase';
import {
  DeleteBlogCommand,
  DeleteBlogUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/delete-blog.usecase';
import {
  UpdatePostByBlogIdCommand,
  UpdatePostByBlogIdUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/update-postByBlogId.usecase';
import {
  DeletePostByBlogIdCommand,
  DeletePostByBlogIdUseCase,
} from '../src/modules/bloggers-platform/blogs/application/usecases/delete-postByBlogId.usecase';
import { DomainException } from '../src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../src/core/exceptions/domain-exception-codes';
import { PostEntity } from '../src/modules/bloggers-platform/posts/domain/post.entity';
import { TestingService } from '../src/modules/testing/ application/testing.service';

describe('blogs', () => {
  let app: INestApplication;
  let blogsRepository: BlogsRepository;
  let postsRepository: PostsRepository;
  let createBlogUseCase: CreateBlogUseCase;
  let updateBlogUseCase: UpdateBlogUseCase;
  let deleteBlogUseCase: DeleteBlogUseCase;
  let updatePostByBlogIdUseCase: UpdatePostByBlogIdUseCase;
  let deletePostByBlogIdUseCase: DeletePostByBlogIdUseCase;
  let testingService: TestingService;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    blogsRepository = app.get(BlogsRepository);
    postsRepository = app.get(PostsRepository);
    createBlogUseCase = app.get(CreateBlogUseCase);
    updateBlogUseCase = app.get(UpdateBlogUseCase);
    deleteBlogUseCase = app.get(DeleteBlogUseCase);
    updatePostByBlogIdUseCase = app.get(UpdatePostByBlogIdUseCase);
    deletePostByBlogIdUseCase = app.get(DeletePostByBlogIdUseCase);
    testingService = app.get(TestingService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await testingService.clearDatabase();
  });

  const dto = {
    name: 'test Blog',
    description: 'test description',
    websiteUrl: 'http://example.com/',
  };

  const dto_2 = {
    name: 'test Blog2',
    description: 'test description2',
    websiteUrl: 'http://example.com/2',
  };

  it('should successfully create a new blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    expect(blogId).toBeDefined();
    expect(typeof blogId).toBe('string');
    const createdBlog = await blogsRepository.findById(blogId);
    expect(createdBlog).not.toBeNull();
  });

  it('should successfully update existing blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));

    const updateDto = {
      name: 'Updated Name',
      description: 'Updated description',
      websiteUrl: 'https://updated.com',
    };
    await updateBlogUseCase.execute(new UpdateBlogCommand(blogId, updateDto));

    const updatedBlog = await blogsRepository.findById(blogId);
    expect(updatedBlog!.name).toBe(updateDto.name);
  });

  it('should (NotFound) when updating non-existent blog', async () => {
    const nonBlogId = crypto.randomUUID();
    const updateDto = {
      name: 'Updated Name',
      description: 'Updated description',
      websiteUrl: 'https://updated.com',
    };
    await expect(
      updateBlogUseCase.execute(new UpdateBlogCommand(nonBlogId, updateDto)),
    ).rejects.toThrow(
      new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      }),
    );
  });

  it('should successfully soft-delete a blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    await deleteBlogUseCase.execute(new DeleteBlogCommand(blogId));
    const deletedBlog = await blogsRepository.findById(blogId);
    expect(deletedBlog).toBeNull();
  });

  it('should  (NotFound) when deleting non-existent blog', async () => {
    const nonExistentId = crypto.randomUUID();
    await expect(
      deleteBlogUseCase.execute(new DeleteBlogCommand(nonExistentId)),
    ).rejects.toThrow(DomainException);
  });

  it('should successfully update a post belonging to correct blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    const postId = crypto.randomUUID();
    const initialPost = new PostEntity();
    initialPost.id = postId;
    initialPost.title = 'title';
    initialPost.shortDescription = 'shortDesc';
    initialPost.content = 'content';
    initialPost.blogId = blogId;
    await postsRepository.save(initialPost);
    const updateDto = {
      title: 'updated title',
      shortDescription: 'updated title',
      content: 'updated title',
    };
    await updatePostByBlogIdUseCase.execute(
      new UpdatePostByBlogIdCommand(blogId, postId, updateDto),
    );
    const updatedPost = await postsRepository.findById(postId);
    expect(updatedPost?.title).toBe('updated title');
  });

  it('should throw DomainException if post belongs to another blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    const blogId_2 = await createBlogUseCase.execute(
      new CreateBlogCommand(dto_2),
    );
    const postId = crypto.randomUUID();
    const initialPost = new PostEntity();
    initialPost.id = postId;
    initialPost.title = 'title';
    initialPost.shortDescription = 'shortDesc';
    initialPost.content = 'content';
    initialPost.blogId = blogId;

    await postsRepository.save(initialPost);
    const updateDto = {
      title: 'updated title',
      shortDescription: 'updated title',
      content: 'updated title',
    };
    await expect(
      updatePostByBlogIdUseCase.execute(
        new UpdatePostByBlogIdCommand(blogId_2, postId, updateDto),
      ),
    ).rejects.toThrow(
      new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found for this blog',
      }),
    );
  });

  it('should successfully soft-delete a post within a blog', async () => {
    const blogId = await createBlogUseCase.execute(new CreateBlogCommand(dto));
    const postId = crypto.randomUUID();
    const initialPost = new PostEntity();
    initialPost.id = postId;
    initialPost.title = 'title';
    initialPost.shortDescription = 'shortDesc';
    initialPost.content = 'content';
    initialPost.blogId = blogId;
    await postsRepository.save(initialPost);
    await deletePostByBlogIdUseCase.execute(
      new DeletePostByBlogIdCommand(blogId, postId),
    );

    const deletedPost = await postsRepository.findById(postId);
    expect(deletedPost).toBeNull();
  });
});
