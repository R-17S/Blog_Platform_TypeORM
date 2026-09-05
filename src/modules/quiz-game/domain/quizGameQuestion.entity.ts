import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionEntity } from './question.entity';
import { PairGameEntity } from './quizGame.entity';

@Entity({ name: 'quiz_game_questions' })
export class QuizGameQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column()
  questionId: string;

  @Column({ type: 'int' })
  orderIndex: number;

  @ManyToOne(() => PairGameEntity, (game) => game.gameQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameId' })
  game: PairGameEntity;

  @ManyToOne(() => QuestionEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: QuestionEntity;
}