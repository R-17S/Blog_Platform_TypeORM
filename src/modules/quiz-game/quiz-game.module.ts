import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './domain/questionEntity';
import { CqrsModule } from '@nestjs/cqrs';
import { SaQuizQuestionsController } from './api/question-sa.controller';
import { QuestionsRepository } from './infrastructure/questions.repository';
import { QuestionsQueryRepository } from './infrastructure/query/questions.query-repository';
import { CreateQuestionUseCase } from './application/create-question.useCase';
import { DeleteQuestionUseCase } from './application/delete-question.useCase';
import { PublishQuestionUseCase } from './application/publish-question.useCase';
import { UpdateQuestionUseCase } from './application/update-question.useCase';


@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([QuestionEntity])],
  controllers: [SaQuizQuestionsController],
  providers: [
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    PublishQuestionUseCase,
    UpdateQuestionUseCase,
    QuestionsRepository,
    QuestionsQueryRepository,
  ],
  exports: [QuestionsRepository],
})
export class QuizGameModule {}
