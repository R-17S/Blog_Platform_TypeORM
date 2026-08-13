import { BasicAuthGuard } from '../../user-accounts/guards/basic/basic-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
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
import { CommandBus } from '@nestjs/cqrs';
import { QuestionsQueryRepository } from '../infrastructure/query/questions.query-repository';
import { QuestionsInputQuery } from './query-dto/get-questions-query-params.input-dto';
import { QuestionViewPaginated } from './view-dto/questions.view-dto';
import { CreateQuestionInputModel } from '../dto/create-question.dto';
import { CreateQuestionCommand } from '../application/create-question.useCase';
import { UpdateQuestionInputModel } from '../dto/update-question.dto';
import { UpdateQuestionCommand } from '../application/update-question.useCase';
import { PublishQuestionInputModel } from '../dto/update-questionPublish.dto';
import { PublishQuestionCommand } from '../application/publish-question.useCase';
import { DeleteQuestionCommand } from '../application/delete-question.useCase';

@UseGuards(BasicAuthGuard)
@SkipThrottle()
@Controller('sa/quiz/questions')
export class SaQuizQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(
    @Query() query: QuestionsInputQuery,
  ): Promise<QuestionViewPaginated> {
    return this.questionsQueryRepository.getAllQuestions(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(@Body() input: CreateQuestionInputModel): Promise<void> {
    await this.commandBus.execute<CreateQuestionCommand, void>(
      new CreateQuestionCommand(input.body, input.correctAnswers),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id') id: string,
    @Body() input: UpdateQuestionInputModel,
  ): Promise<void> {
    await this.commandBus.execute<UpdateQuestionCommand, void>(
      new UpdateQuestionCommand(id, input.body, input.correctAnswers),
    );
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishQuestion(
    @Param('id') id: string,
    @Body() input: PublishQuestionInputModel,
  ): Promise<void> {
    await this.commandBus.execute<PublishQuestionCommand, void>(
      new PublishQuestionCommand(id, input.published),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute<DeleteQuestionCommand, void>(
      new DeleteQuestionCommand(id),
    );
  }
}
