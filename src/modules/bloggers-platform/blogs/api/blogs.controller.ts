import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogInputQuery } from './input-dto/get-blogs-query-params.input-dto';
import { BlogsViewPaginated } from './view-dto/blogs.view-dto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { PostsViewPaginated } from '../../posts/api/view-dto/posts.view-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { PostInputQuery } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

@SkipThrottle()
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepository,

    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  @Get()
  async getBlogs(@Query() query: BlogInputQuery): Promise<BlogsViewPaginated> {
    return this.blogsQueryRepository.getAllBlogs(query);
  }

  @Get(':blogId/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: PostInputQuery,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PostsViewPaginated> {
    await this.blogsRepository.checkBlogExistsOrError(blogId);
    return await this.postsQueryRepository.getPostsByBlogId(
      blogId,
      query,
      user?.id,
    );
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string) {
    return await this.blogsQueryRepository.getBlogByIdOrError(id);
  }
}
