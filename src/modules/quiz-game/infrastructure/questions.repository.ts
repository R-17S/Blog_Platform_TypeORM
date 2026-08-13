import { QuestionEntity } from '../domain/questionEntity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questRepo: Repository<QuestionEntity>,
  ) {}

  async save(quest: QuestionEntity): Promise<void> {
    await this.questRepo.save(quest);
  }

  async findById(id: string): Promise<QuestionEntity | null> {
    return await this.questRepo.findOneBy({ id });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.questRepo.delete(id);
    return result.affected !== 0;
  }
}
