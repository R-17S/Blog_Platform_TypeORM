import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { QuestionEntity } from '../../src/modules/quiz-game/domain/question.entity';
import { QuestionsRepository } from '../../src/modules/quiz-game/infrastructure/questions.repository';
import {
  AnswerViewModel,
  GameViewModel,
} from '../../src/modules/quiz-game/api/view-dto/game.view-dto';

export class PairGameManager {
  constructor(
    private app: INestApplication,
    private questionsRepo: QuestionsRepository,
  ) {}

  async createQuestions(count: number = 5): Promise<QuestionEntity[]> {
    const questions: QuestionEntity[] = [];
    for (let i = 1; i <= count; i++) {
      const res = QuestionEntity.create(`Question ${i}`, [`answer-${i}`]);
      res.updatePublish(true);
      await this.questionsRepo.save(res);
      questions.push(res);
    }
    return questions;
  }

  async connection(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ): Promise<{
    status: number;
    body: GameViewModel;
  }> {
    const res = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/connection`)
      .auth(accessToken, { type: 'bearer' })
      .expect(expectedStatus);
    return { status: res.status, body: res.body };
  }

  async sendAnswers(
    accessToken: string,
    answer: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ): Promise<{ status: number; body: AnswerViewModel }> {
    const res = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current/answers`)
      .auth(accessToken, { type: 'bearer' })
      // .set('Authorization', `Bearer ${accessToken}`)
      .send({ answer })
      .expect(expectedStatus);
    return { status: res.status, body: res.body };
  }

  async getMyCurrentGame(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ): Promise<{ status: number; body: GameViewModel }> {
    const response = await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my-current`)
      .auth(accessToken, { type: 'bearer' })
      // .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return { status: response.status, body: response.body };
  }

  async getGameById(
    accessToken: string,
    gameId: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ): Promise<{ status: number; body: GameViewModel }> {
    const response = await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/${gameId}`)
      .auth(accessToken, { type: 'bearer' })
      // .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return { status: response.status, body: response.body };
  }

  async getMyGames(
    accessToken: string,
    query?: {
      sortBy?: string;
      sortDirection?: string;
      pageNumber?: number;
      pageSize?: number;
    },
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const res = await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/pair-game-quiz/pairs/my`)
      .auth(accessToken, { type: 'bearer' })
      .query(query || {})
      .expect(expectedStatus);

    return { status: res.status, body: res.body };
  }
}
