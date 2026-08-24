import { INestApplication } from '@nestjs/common';
import { UpdateQuestionUseCase } from '../src/modules/quiz-game/application/update-question.useCase';
import { QuestionsRepository } from '../src/modules/quiz-game/infrastructure/questions.repository';
import { PublishQuestionUseCase } from '../src/modules/quiz-game/application/publish-question.useCase';
import { CreateQuestionUseCase } from '../src/modules/quiz-game/application/create-question.useCase';
import { initSettings } from './helpers/init-settings';
import { beforeEach } from 'node:test';
import { QuestionEntity } from '../src/modules/quiz-game/domain/question.entity';
import { DomainException } from '../src/core/exceptions/domain-exceptions';

describe('question', () => {
  let app: INestApplication;
  let createUseCase: CreateQuestionUseCase;
  let publishUseCase: PublishQuestionUseCase;
  let questionsRepo: QuestionsRepository;
  let updateUseCase: UpdateQuestionUseCase;

  const mockTypeOrmRepo = {
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    createUseCase = app.get(CreateQuestionUseCase);
    publishUseCase = app.get(PublishQuestionUseCase);
    questionsRepo = app.get(QuestionsRepository);
    updateUseCase = app.get(UpdateQuestionUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {});

  describe('CreateQuestionUseCase', () => {
    it('should create question with published: false and return id', async () => {
      const command = {
        body: 'What is TypeScript?',
        correctAnswers: ['Language', 'JS superset'],
      };

      mockTypeOrmRepo.save.mockImplementation((entity) =>
        Promise.resolve({ id: 'uuid-1', ...entity }),
      );

      const resultId = await createUseCase.execute(command);

      expect(typeof resultId).toBe('string');
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          body: command.body,
          correctAnswers: command.correctAnswers,
          published: false,
        }),
      );
      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('UpdateQuestionUseCase', () => {
    it('should update question body and correctAnswers', async () => {
      const existingQuestion = QuestionEntity.create('Old body', [
        'Old answer',
      ]);
      existingQuestion.id = 'uuid-update-1';

      jest.spyOn(questionsRepo, 'findById').mockResolvedValue(existingQuestion);
      mockTypeOrmRepo.save.mockImplementation((q) => Promise.resolve(q));

      await updateUseCase.execute({
        id: 'uuid-update-1',
        body: 'New updated body',
        correctAnswers: ['New answer 1'],
      });

      expect(existingQuestion.body).toBe('New updated body');
      expect(existingQuestion.correctAnswers).toEqual(['New answer 1']);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(existingQuestion);
    });

    it('should throw DomainException (404) if question is not found', async () => {
      jest.spyOn(questionsRepo, 'findById').mockResolvedValue(null);

      await expect(
        updateUseCase.execute({
          id: 'non-existent-id',
          body: 'Any body',
          correctAnswers: ['Any answer'],
        }),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('PublishQuestionUseCase', () => {
    it('should throw DomainException (400) if publishing question without correct answers', async () => {
      const questionWithoutAnswers = QuestionEntity.create('Bad quest', []);
      questionWithoutAnswers.id = 'uuid-2';

      jest
        .spyOn(questionsRepo, 'findById')
        .mockResolvedValue(questionWithoutAnswers);

      await expect(
        publishUseCase.execute({ id: 'uuid-2', published: true }),
      ).rejects.toThrow(DomainException);
    });

    it('should publish question if correct answers exist', async () => {
      const questionWithAnswers = QuestionEntity.create('Good quest', [
        'dsghsdgs',
      ]);
      questionWithAnswers.id = 'uuid-3';

      jest
        .spyOn(questionsRepo, 'findById')
        .mockResolvedValue(questionWithAnswers);
      mockTypeOrmRepo.save.mockImplementation((q) => Promise.resolve(q));

      await publishUseCase.execute({ id: 'uuid-3', published: true });

      expect(questionWithAnswers.published).toBe(true);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
