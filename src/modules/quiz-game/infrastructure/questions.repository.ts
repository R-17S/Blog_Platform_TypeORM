import { QuestionEntity } from '../domain/question.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionDomainViewModel } from '../api/view-dto/questions.view-dto';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questRepo: Repository<QuestionEntity>,
  ) {}

  async save(quest: QuestionEntity): Promise<QuestionEntity> {
    return await this.questRepo.save(quest);
  }

  async findById(id: string): Promise<QuestionEntity | null> {
    return await this.questRepo.findOneBy({ id });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.questRepo.delete(id);
    return result.affected !== 0;
  }

  async getRandomQuestions(limit: number = 5): Promise<QuestionEntity[]> {
    return this.questRepo
      .createQueryBuilder('q')
      .where('q.published = true')
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();
  }
}
