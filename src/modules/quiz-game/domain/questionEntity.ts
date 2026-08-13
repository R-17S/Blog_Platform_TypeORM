import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Entity({ name: 'QuizQuestion' })
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json' })
  correctAnswers: string[];

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  static create(body: string, correctAnswers: string[]): QuestionEntity {
    const question = new QuestionEntity();
    question.body = body;
    question.correctAnswers = correctAnswers;
    question.published = false;
    return question;
  }

  update(body: string, correctAnswers: string[]): void {
    this.body = body;
    this.correctAnswers = correctAnswers;
  }

  updatePublish(published: boolean): void {
    if (
      published &&
      (!this.correctAnswers || this.correctAnswers.length === 0)
    ) {
      throw new BadRequestException({
        code: DomainExceptionCode.BadRequest,
        message: 'Cannot publish question without correct answers',
      });
    }
    this.published = published;
  }
}
