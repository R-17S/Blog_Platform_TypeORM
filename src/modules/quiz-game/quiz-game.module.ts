import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './domain/question.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { SaQuizQuestionsController } from './api/question-sa.controller';
import { QuestionsRepository } from './infrastructure/questions.repository';
import { QuestionsQueryRepository } from './infrastructure/query/questions.query-repository';
import { CreateQuestionUseCase } from './application/create-question.useCase';
import { DeleteQuestionUseCase } from './application/delete-question.useCase';
import { PublishQuestionUseCase } from './application/publish-question.useCase';
import { UpdateQuestionUseCase } from './application/update-question.useCase';
import { PairGameEntity } from './domain/quizGame.entity';
import { PlayerProgressEntity } from './domain/playerProgress.entity';
import { PairGameController } from './api/pair-game.controller';
import { ConnectToGameUseCase } from './application/connection-toGame.useCase';
import { SendAnswerUseCase } from './application/send-answer.useCase';
import { PairGamesQueryRepository } from './infrastructure/query/pair-games.query-repository';
import { PairGameRepository } from './infrastructure/pair-games.repository';
import { AuthModule } from '../user-accounts/auth.module';
import { UsersQuizController } from './api/users-quiz.controller';
import { QuizGameQuestionEntity } from './domain/quizGameQuestion.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      QuestionEntity,
      PairGameEntity,
      PlayerProgressEntity,
      QuizGameQuestionEntity,
    ]),
    AuthModule,
  ],
  controllers: [
    SaQuizQuestionsController,
    PairGameController,
    UsersQuizController,
  ],
  providers: [
    //sa
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    PublishQuestionUseCase,
    UpdateQuestionUseCase,
    QuestionsRepository,
    QuestionsQueryRepository,
    // no sa
    ConnectToGameUseCase,
    SendAnswerUseCase,
    PairGamesQueryRepository,
    PairGameRepository,
  ],
  exports: [QuestionsRepository],
})
export class QuizGameModule {}
