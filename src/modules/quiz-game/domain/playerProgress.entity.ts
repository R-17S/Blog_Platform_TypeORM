import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../user-accounts/domain/user.entity';

export enum AnswerStatus {
  CORRECT = 'Correct',
  INCORRECT = 'Incorrect',
}

export class AnswerVo {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: Date;
}

@Entity('gamePlayerProgress')
export class PlayerProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  player: UserEntity;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'jsonb', default: [] })
  answers: AnswerVo[];

  static create(player: UserEntity): PlayerProgressEntity {
    const progress = new PlayerProgressEntity();
    progress.player = player;
    progress.score = 0;
    progress.answers = [];
    return progress;
  }

  addAnswer(questionId: string, isCorrect: boolean): AnswerVo {
    const answerVo: AnswerVo = {
      questionId,
      answerStatus: isCorrect ? AnswerStatus.CORRECT : AnswerStatus.INCORRECT,
      addedAt: new Date(),
    };

    this.answers.push(answerVo);

    if (isCorrect) {
      this.score += 1;
    }

    return answerVo;
  }
}
