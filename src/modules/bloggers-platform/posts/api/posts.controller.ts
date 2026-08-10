import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostInputQuery } from './input-dto/get-posts-query-params.input-dto';
import { PostsViewPaginated, PostViewModel } from './view-dto/posts.view-dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostsRepository } from '../infrastructure/posts.repository';
import {
  CommentsViewPaginated,
  CommentViewModel,
} from '../../comments/api/view-dto/comments.view-dto';
import { CommentInputQuery } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CreateCommentDto } from '../../comments/dto/create-comment.dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { UpdateLikeStatusDto } from '../../../../core/dto/update-like-status.dto';
import { UpdatePostLikeStatusCommand } from '../application/usecases/update-post-like-status-use.case';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts.singleQuery-repository';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.singleQuery-repository';

@SkipThrottle()
@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsRepository: PostsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() input: UpdateLikeStatusDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePostLikeStatusCommand(
        postId,
        user.id,
        user.login,
        input.likeStatus,
      ),
    );
  }

  @Get(':postId/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() query: CommentInputQuery,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<CommentsViewPaginated> {
    await this.postsRepository.checkPostExistsOrError(postId);
    return await this.commentsQueryRepository.getCommentsByPostIdSingleQuery(
      postId,
      query,
      user?.id,
    );
  }

  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('postId') postId: string,
    @Body() input: CreateCommentDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewModel> {
    const newCommentId = await this.commandBus.execute<
      CreateCommentCommand,
      string
    >(new CreateCommentCommand(input, postId, user.id, user.login));
    return this.commentsQueryRepository.getCommentByIdOrErrorSingleQuery(
      newCommentId,
    );
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getPosts(
    @Query() query: PostInputQuery,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostsViewPaginated> {
    return this.postsQueryRepository.getAllPostsSingleQuery(query, user?.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() input: CreatePostDto): Promise<PostViewModel> {
    const newPostId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand(
        input.title,
        input.shortDescription,
        input.content,
        input.blogId,
      ),
    );
    return await this.postsQueryRepository.getPostByIdOrErrorSingleQuery(
      newPostId,
    );
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getPostById(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ) {
    return await this.postsQueryRepository.getPostByIdOrErrorSingleQuery(
      id,
      user?.id,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() input: UpdatePostDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand(id, input),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(id),
    );
  }
}
