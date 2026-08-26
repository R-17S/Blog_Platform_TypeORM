import {
  AnswerStatus,
  PlayerProgressEntity,
} from '../../domain/playerProgress.entity';
import { GameStatus, PairGameEntity } from '../../domain/quizGame.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

export class PlayerViewModel {
  id: string;
  login: string;
}

export class AnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
}

export class PlayerProgressViewModel {
  answers: AnswerViewModel[];
  player: PlayerViewModel;
  score: number;
}

export class QuestionViewModel {
  id: string;
  body: string;
}

export class GameViewModel {
  id: string;
  firstPlayerProgress: PlayerProgressViewModel;
  secondPlayerProgress: PlayerProgressViewModel | null;
  questions: QuestionViewModel[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
}

export class GameMapper {
  static toView(game: PairGameEntity): GameViewModel {
    const isPending = game.status === GameStatus.PENDING_SECOND_PLAYER;

    return {
      id: game.id,
      firstPlayerProgress: this.mapPlayerProgress(game.firstPlayerProgress),
      secondPlayerProgress:
        isPending || !game.secondPlayerProgress
          ? null
          : this.mapPlayerProgress(game.secondPlayerProgress),
      questions:
        isPending || !game.questions
          ? null
          : game.questions.map(
              (q): QuestionViewModel => ({
                id: q.id,
                body: q.body,
              }),
            ),
      status: game.status,
      pairCreatedDate: game.pairCreatedDate.toISOString(),
      startGameDate:
        isPending || !game.startGameDate
          ? null
          : game.startGameDate.toISOString(),
      finishGameDate:
        isPending || !game.finishGameDate
          ? null
          : game.finishGameDate.toISOString(),
    };
  }

  private static mapPlayerProgress(
    progress: PlayerProgressEntity,
  ): PlayerProgressViewModel {
    return {
      answers: progress.answers.map(
        (a): AnswerViewModel => ({
          questionId: a.questionId,
          answerStatus: a.answerStatus,
          addedAt: new Date(a.addedAt).toISOString(),
        }),
      ),
      player: {
        id: progress.player.id,
        login: progress.player.login,
      },
      score: progress.score,
    };
  }
}

export class GamesViewPaginated extends PaginatedViewDto<GameViewModel[]> {
  //items: BlogViewModel[];
}
