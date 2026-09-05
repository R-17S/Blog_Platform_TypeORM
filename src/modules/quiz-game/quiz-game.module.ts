import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './domain/question.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { SaQuizQuestionsController } from './api/question-sa.controller';
import { QuestionsRepository } from './infrastructure/questions.repository';
import { QuestionsQueryRepository } from './infrastructure/query/questions.query-repository';
import { CreateQuestionUseCase } from './application/use-cases/create-question.useCase';
import { DeleteQuestionUseCase } from './application/use-cases/delete-question.useCase';
import { PublishQuestionUseCase } from './application/use-cases/publish-question.useCase';
import { UpdateQuestionUseCase } from './application/use-cases/update-question.useCase';
import { PairGameEntity } from './domain/quizGame.entity';
import { PlayerProgressEntity } from './domain/playerProgress.entity';
import { PairGameController } from './api/pair-game.controller';
import { ConnectToGameUseCase } from './application/use-cases/connection-toGame.useCase';
import { SendAnswerUseCase } from './application/use-cases/send-answer.useCase';
import { PairGamesQueryRepository } from './infrastructure/query/pair-games.query-repository';
import { PairGameRepository } from './infrastructure/pair-games.repository';
import { AuthModule } from '../user-accounts/auth.module';
import { UsersQuizController } from './api/users-quiz.controller';
import { QuizGameQuestionEntity } from './domain/quizGameQuestion.entity';
import { GameTimerService } from './application/game-timer.service';

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
    GameTimerService,
  ],
  exports: [QuestionsRepository],
})
export class QuizGameModule {}
