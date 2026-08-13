import { INestApplication } from '@nestjs/common';
import { initSettings } from './helpers/init-settings';
import { beforeEach } from 'node:test';
import { TestingService } from '../src/modules/testing/ application/testing.service';
import * as request from 'supertest';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { QuestionsRepository } from '../src/modules/quiz-game/infrastructure/questions.repository';
import { QuestionEntity } from '../src/modules/quiz-game/domain/questionEntity';

describe('SA Quiz Questions GET (e2e)', () => {
  let app: INestApplication;
  let testingService: TestingService;
  let questionsRepo: QuestionsRepository;

  const basicAuthHeader =
    'Basic ' + Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    testingService = app.get(TestingService);
    questionsRepo = app.get(QuestionsRepository);
    await testingService.clearQuizDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {});

  describe('GET /sa/quiz/questions', () => {
    it('should return 401 Unauthorized if no basic auth', async () => {
      await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
        .expect(401);
    });

    it('should return paginated list with default params', async () => {
      const q1 = QuestionEntity.create('How to use NestJS?', ['Framework']);
      const q2 = QuestionEntity.create('What is Postgres?', ['Database']);
      q2.updatePublish(true);
      await questionsRepo.save(q1);
      await questionsRepo.save(q2);

      const responce = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
        .set('Authorization', basicAuthHeader)
        .expect(200);

      expect(responce.body).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: expect.arrayContaining([
          expect.objectContaining({
            body: 'How to use NestJS?',
            published: false,
          }),
          expect.objectContaining({
            body: 'What is Postgres?',
            published: true,
          }),
        ]),
      });
    });

    it('should filter questions by bodySearchTerm and publishedStatus', async () => {
      // Запрос фильтрации: только опубликованные со словом "Postgres"
      const response = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/sa/quiz/questions`)
        .query({
          bodySearchTerm: 'postgres',
          publishedStatus: 'published',
        })
        .set('Authorization', basicAuthHeader)
        .expect(200);

      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].body).toBe('What is Postgres?');
      expect(response.body.items[0].published).toBe(true);
    });
  });
});
