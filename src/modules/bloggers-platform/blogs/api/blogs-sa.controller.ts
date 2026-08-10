import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BlogInputQuery } from './input-dto/get-blogs-query-params.input-dto';
import { BlogsViewPaginated, BlogViewModel } from './view-dto/blogs.view-dto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import {
  PostsViewPaginated,
  PostViewModel,
} from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostDto } from '../../posts/dto/create-post.dto';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { PostInputQuery } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { UpdatePostByBlogIdCommand } from '../application/usecases/update-postByBlogId.usecase';
import { DeletePostByBlogIdCommand } from '../application/usecases/delete-postByBlogId.usecase';
import { UpdatePostByBlogIdDto } from '../../posts/dto/update-postByBlogId.dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.singleQuery-repository';

@UseGuards(BasicAuthGuard)
@SkipThrottle()
@Controller('sa/blogs')
export class BlogsSuperController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,

    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getBlogs(@Query() query: BlogInputQuery): Promise<BlogsViewPaginated> {
    return this.blogsQueryRepository.getAllBlogs(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(@Body() input: CreateBlogDto): Promise<BlogViewModel> {
    const newBlogId = await this.commandBus.execute<CreateBlogCommand, string>(
      new CreateBlogCommand(input),
    );
    return await this.blogsQueryRepository.getBlogByIdOrError(newBlogId);
  }

  @Get(':blogId/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: PostInputQuery,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PostsViewPaginated> {
    return await this.postsQueryRepository.getPostsByBlogIdSingleQuery(
      blogId,
      query,
      user?.id,
    );
  }

  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() input: CreatePostDto,
  ): Promise<PostViewModel> {
    const newPostId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand(
        input.title,
        input.shortDescription,
        input.content,
        blogId,
      ),
    );
    return await this.postsQueryRepository.getPostByIdOrErrorSingleQuery(
      newPostId,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() input: UpdateBlogDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateBlogCommand, void>(
      new UpdateBlogCommand(id, input),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute<DeleteBlogCommand, void>(
      new DeleteBlogCommand(id),
    );
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostByBlogId(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() input: UpdatePostByBlogIdDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdatePostByBlogIdCommand, void>(
      new UpdatePostByBlogIdCommand(blogId, postId, input),
    );
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostByBlogId(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    await this.commandBus.execute<DeletePostByBlogIdCommand, void>(
      new DeletePostByBlogIdCommand(blogId, postId),
    );
  }
}
