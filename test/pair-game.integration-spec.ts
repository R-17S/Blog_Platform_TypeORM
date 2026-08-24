import { UserEntity } from '../src/modules/user-accounts/domain/user.entity';
import { QuestionEntity } from '../src/modules/quiz-game/domain/question.entity';
import { INestApplication } from '@nestjs/common';
import { PairGameManager } from './helpers/pair-game-manager';
import { initSettings } from './helpers/init-settings';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { TestingService } from '../src/modules/testing/ application/testing.service';
import {
  GameStatus,
  PairGameEntity,
} from '../src/modules/quiz-game/domain/quizGame.entity';
import { AnswerStatus } from '../src/modules/quiz-game/domain/playerProgress.entity';

describe('PairGameEntity (Domain Integration)', () => {
  let app: INestApplication;
  let pairGameManager: PairGameManager;
  let testingService: TestingService;
  let userA: UserEntity;
  let userB: UserEntity;
  let questions: QuestionEntity[];

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useValue(
          new JwtService({
            secret: process.env.ACCESS_TOKEN_SECRET || 'secretOrKey_forTest', //TODO: move to env. will be in the following lessons
            signOptions: { expiresIn: '20s' },
          }),
        );
    });
    app = result.app;
    pairGameManager = result.pairGameManager;
    testingService = app.get(TestingService);
    await testingService.clearQuizDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    userA = { id: 'user-a-id', login: 'UserA' } as UserEntity;
    userB = { id: 'user-b-id', login: 'UserB' } as UserEntity;
    questions = await pairGameManager.createQuestions(5);
  });

  it('should create game in PendingSecondPlayer status', () => {
    const game = PairGameEntity.create(userA);
    expect(game.status).toBe(GameStatus.PENDING_SECOND_PLAYER);
    expect(game.firstPlayerProgress.player.login).toBe('UserA');
    expect(game.secondPlayerProgress).toBeNull();
    expect(game.questions).toBeNull();
  });

  it('should connect second player and start game (Active)', () => {
    const game = PairGameEntity.create(userA);
    game.connectSecondPlayer(userB, questions);
    expect(game.status).toBe(GameStatus.ACTIVE);
    expect(game.secondPlayerProgress?.player.login).toBe('UserB');
    expect(game.questions?.length).toBe(5);
    expect(game.startGameDate).not.toBeNull();
  });

  it('should calculate correct answers and give bonus point to faster player', () => {
    const game = PairGameEntity.create(userA);
    game.connectSecondPlayer(userB, questions);

    for (let i = 1; i <= 5; i++) {
      const result = game.sendAnswer(userA.id, `answer-${i}`);
      expect(result.answerStatus).toBe(AnswerStatus.CORRECT);
    }

    expect(game.status).toBe(GameStatus.ACTIVE);
    expect(game.firstPlayerProgress.score).toBe(5);

    for (let i = 1; i <= 5; i++) {
      const result = game.sendAnswer(userB.id, `answer-${i}`);
      expect(result.answerStatus).toBe(AnswerStatus.CORRECT);
    }

    expect(game.status).toBe(GameStatus.FINISHED);
    expect(game.secondPlayerProgress?.score).toBe(5);

    expect(game.firstPlayerProgress.score).toBe(6);
    expect(game.secondPlayerProgress?.score).toBe(5);
  });

  it('should NOT give bonus point if faster player has 0 correct answers', () => {
    const game = PairGameEntity.create(userA);
    game.connectSecondPlayer(userB, questions);

    for (let i = 1; i <= 5; i++) {
      game.sendAnswer(userA.id, `sdfbsbs`);
    }
    game.sendAnswer(userB.id, 'answer-1');
    for (let i = 2; i <= 5; i++) {
      game.sendAnswer(userB.id, `tgymtymtym`);
    }

    expect(game.status).toBe(GameStatus.FINISHED);
    expect(game.firstPlayerProgress.score).toBe(0);
    expect(game.secondPlayerProgress?.score).toBe(1);
  });
});
