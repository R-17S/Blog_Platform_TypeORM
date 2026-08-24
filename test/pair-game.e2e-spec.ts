import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingService } from '../src/modules/testing/ application/testing.service';
import { initSettings } from './helpers/init-settings';
import { beforeEach } from 'node:test';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { UsersTestManager } from './helpers/users-test-manager';
import { PairGameManager } from './helpers/pair-game-manager';
import { GameStatus } from '../src/modules/quiz-game/domain/quizGame.entity';

describe('Pair Game (e2e)', () => {
  let app: INestApplication;
  let testingService: TestingService;
  let userTestManager: UsersTestManager;
  let pairGameManager: PairGameManager;
  let userAToken: string;
  let userBToken: string;
  let userCToken: string;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useValue(
          new JwtService({
            secret: process.env.ACCESS_TOKEN_SECRET || 'secretOrKey_forTest', //TODO: move to env. will be in the following lessons
            signOptions: { expiresIn: '200s' },
          }),
        );
    });

    app = result.app;
    userTestManager = result.userTestManager;
    pairGameManager = result.pairGameManager;
    testingService = app.get(TestingService);
    await testingService.clearDatabase();
    await testingService.clearQuizDatabase();
    await pairGameManager.createQuestions(5);

    const tokens = await userTestManager.createAndLoginSeveralUsers(3);
    userAToken = tokens[0].accessToken;
    userBToken = tokens[1].accessToken;
    userCToken = tokens[2].accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {});

  describe('1. POST /pair-game-quiz/pairs/connection', () => {
    it('should return 401 Unauthorized if no bearer token provided', async () => {
      await pairGameManager.connection('', HttpStatus.UNAUTHORIZED);
    });

    it('Player A should create game and wait for second player (200 OK)', async () => {

      const { body } = await pairGameManager.connection(
        userAToken,
        HttpStatus.OK,
      );

      expect(body).toEqual({
        id: expect.any(String),
        firstPlayerProgress: expect.objectContaining({
          score: 0,
          answers: [],
          player: expect.objectContaining({ id: expect.any(String) }),
        }),
        secondPlayerProgress: null,
        questions: null,
        status: 'PendingSecondPlayer',
        pairCreatedDate: expect.any(String),
        startGameDate: null,
        finishGameDate: null,
      });
    });

    it('Player A should get 403 Forbidden if trying to connect while already in active pair', async () => {
      await pairGameManager.connection(userAToken, HttpStatus.FORBIDDEN);
    });

    it('Player B connects and game becomes Active with 5 questions', async () => {
      const { body } = await pairGameManager.connection(
        userBToken,
        HttpStatus.OK,
      );

      expect(body.status).toBe('Active');
      expect(body.secondPlayerProgress).not.toBeNull();
      expect(body.questions).toHaveLength(5);
      expect(body.startGameDate).not.toBeNull();
    });
  });

  describe('2. GET /pair-game-quiz/pairs/my-current', () => {
    it('should return 404 Not Found if user has no current active game', async () => {
      await testingService.clearQuizDatabase();
      await pairGameManager.getMyCurrentGame(userAToken, HttpStatus.NOT_FOUND);
    });

    it('should return active game for participating player (200 OK)', async () => {
      await pairGameManager.connection(userAToken, HttpStatus.OK);

      const { body } = await pairGameManager.getMyCurrentGame(
        userAToken,
        HttpStatus.OK,
      );

      expect(body.status).toBe('PendingSecondPlayer');
      expect(body.firstPlayerProgress.score).toBe(0);
    });
  });

  describe('3. POST /pair-game-quiz/pairs/my-current/answers', () => {
    it('should return 403 Forbidden if user is not in active pair', async () => {
      await pairGameManager.createQuestions(5);
      await pairGameManager.sendAnswers(
        userAToken,
        'some answer',
        HttpStatus.FORBIDDEN,
      );
    });

    it('Player A and B submit answers correctly (200 OK)', async () => {
      // await pairGameManager.connection(userAToken, HttpStatus.OK);
      await pairGameManager.connection(userBToken, HttpStatus.OK);

      const { body } = await pairGameManager.sendAnswers(
        userAToken,
        'answer-1',
        HttpStatus.OK,
      );

      expect(body).toEqual({
        questionId: expect.any(String),
        answerStatus: 'Correct',
        addedAt: expect.any(String),
      });
    });

    it('should return 403 Forbidden if user tries to answer 6th question', async () => {
      // await pairGameManager.connection(userAToken, HttpStatus.OK);
      // await pairGameManager.connection(userBToken, HttpStatus.OK);
      for (let i = 2; i <= 5; i++) {
        await pairGameManager.sendAnswers(
          userAToken,
          `answer-${i}`,
          HttpStatus.OK,
        );
      }
      await pairGameManager.sendAnswers(
        userAToken,
        'answer-1',
        HttpStatus.FORBIDDEN,
      );
    });
  });

  describe('4. GET /pair-game-quiz/pairs/:id', () => {
    it('should return 400 Bad Request for invalid UUID', async () => {
      await pairGameManager.getGameById(
        userAToken,
        'dgnmrtgnrt',
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should return 404 Not Found for non-existent game UUID', async () => {
      const randomId = '72ccd82c-cc9e-43d5-9789-7c5786418c86';
      await pairGameManager.getGameById(
        userAToken,
        randomId,
        HttpStatus.NOT_FOUND,
      );
    });
    it('should return 403 Forbidden if Player C (non-participant) tries to view game', async () => {
      await testingService.clearQuizDatabase();
      await pairGameManager.createQuestions(5);
      const { body: game } = await pairGameManager.connection(
        userAToken,
        HttpStatus.OK,
      );
      await pairGameManager.getGameById(
        userCToken,
        game.id,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return game by ID for participant player (200 OK)', async () => {
      await testingService.clearQuizDatabase();
      await pairGameManager.createQuestions(5);
      const { body: game } = await pairGameManager.connection(
        userAToken,
        HttpStatus.OK,
      );
      const { body } = await pairGameManager.getGameById(
        userAToken,
        game.id,
        HttpStatus.OK,
      );
      expect(body.id).toBe(game.id);
    });
  });

  describe('5. Game Finish & Faster Player Bonus Point', () => {
    it('should finish game and award +1 bonus point to faster player with correct answers', async () => {
      await testingService.clearQuizDatabase();
      const createdQuestions = await pairGameManager.createQuestions(5);
      const { body: pendingGame } = await pairGameManager.connection(
        userAToken,
        HttpStatus.OK,
      );
      await pairGameManager.connection(userBToken, HttpStatus.OK);
      const { body: activeGame } = await pairGameManager.getGameById(
        userAToken,
        pendingGame.id,
        HttpStatus.OK,
      );
      for (const q of activeGame.questions!) {
        // Находим правильный ответ именно для ЭТОГО вопроса
        const originQuestion = createdQuestions.find((cq) => cq.id === q.id)!;
        const correctAnswer = originQuestion.correctAnswers[0];

        await pairGameManager.sendAnswers(
          userAToken,
          correctAnswer,
          HttpStatus.OK,
        );
      }

      for (const q of activeGame.questions!) {
        const originQuestion = createdQuestions.find((cq) => cq.id === q.id)!;
        const correctAnswer = originQuestion.correctAnswers[0];

        await pairGameManager.sendAnswers(
          userBToken,
          correctAnswer,
          HttpStatus.OK,
        );
      }

      const { body: finishedGame } = await pairGameManager.getGameById(
        userAToken,
        pendingGame.id,
        HttpStatus.OK,
      );
      expect(finishedGame.status).toBe(GameStatus.FINISHED);
      expect(finishedGame.finishGameDate).not.toBeNull();
      expect(finishedGame.firstPlayerProgress.score).toBe(6);
      expect(finishedGame.secondPlayerProgress!.score).toBe(5);
    });
  });
});
