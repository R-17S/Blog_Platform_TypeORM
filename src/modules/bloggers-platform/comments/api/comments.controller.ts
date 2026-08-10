import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { CommandBus } from '@nestjs/cqrs';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { UpdateLikeStatusDto } from '../../../../core/dto/update-like-status.dto';
import { UpdateCommentLikeStatusCommand } from '../application/usecases/update-comment-like-status.usecase';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { CommentsQueryRepository } from '../infrastructure/query/comments.singleQuery-repository';

@SkipThrottle()
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Put(':commentId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateCommentLikeStatus(
    @Param('commentId') commentId: string,
    @Body() input: UpdateLikeStatusDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentLikeStatusCommand(
        commentId,
        user.id,
        user.login,
        input.likeStatus,
      ),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') id: string,
    @Body() input: UpdateCommentDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateCommentCommand(id, input, user.id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(id, user.id));
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentById(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    return await this.commentsQueryRepository.getCommentByIdOrErrorSingleQuery(
      id,
      user?.id,
    );
  }
}
