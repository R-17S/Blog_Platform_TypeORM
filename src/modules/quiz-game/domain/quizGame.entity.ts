import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionEntity } from './question.entity';
import { UserEntity } from '../../user-accounts/domain/user.entity';
import { AnswerVo, PlayerProgressEntity } from './playerProgress.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export enum GameStatus {
  PENDING_SECOND_PLAYER = 'PendingSecondPlayer',
  ACTIVE = 'Active',
  FINISHED = 'Finished',
}
@Entity({ name: 'quizGames' })
export class PairGameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.PENDING_SECOND_PLAYER,
  })
  status: GameStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  pairCreatedDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startGameDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  finishGameDate: Date | null;

  @OneToOne(() => PlayerProgressEntity, { cascade: true, eager: true })
  @JoinColumn()
  firstPlayerProgress: PlayerProgressEntity;

  @OneToOne(() => PlayerProgressEntity, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  secondPlayerProgress: PlayerProgressEntity | null;

  @ManyToMany(() => QuestionEntity)
  @JoinTable({ name: 'quiz_game_questions' })
  questions: QuestionEntity[] | null;

  static create(firstPlayer: UserEntity): PairGameEntity {
    const game = new PairGameEntity();
    game.status = GameStatus.PENDING_SECOND_PLAYER;
    game.pairCreatedDate = new Date();
    game.startGameDate = null;
    game.finishGameDate = null;
    game.firstPlayerProgress = PlayerProgressEntity.create(firstPlayer);
    game.secondPlayerProgress = null;
    game.questions = null;
    return game;
  }

  connectSecondPlayer(
    secondPlayer: UserEntity,
    question: QuestionEntity[],
  ): void {
    this.secondPlayerProgress = PlayerProgressEntity.create(secondPlayer);
    this.questions = question;
    this.status = GameStatus.ACTIVE;
    this.startGameDate = new Date();
  }

  sendAnswer(userId: string, answer: string): AnswerVo {
    const is_1_player = this.firstPlayerProgress.player.id === userId;
    const is_2_player = this.secondPlayerProgress?.player.id === userId;

    if (!is_1_player && !is_2_player) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You are not a participant in this game',
      });
    }

    const currentProgress = is_1_player
      ? this.firstPlayerProgress
      : this.secondPlayerProgress!;

    if (currentProgress.answers.length >= 5) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: "You've already answered everything, calm down",
      });
    }

    const numberQuest = currentProgress.answers.length;
    const currentQuestion = this.questions![numberQuest];

    const formattedAnswer = answer.trim().toLowerCase();
    const isCorrect = currentQuestion.correctAnswers.some(
      (ca) => ca.trim().toLowerCase() === formattedAnswer,
    );

    const answerVo = currentProgress.addAnswer(currentQuestion.id, isCorrect);
    this.checkAndFinishGame();
    return answerVo;
  }

  checkAndFinishGame(): void {
    if (this.status === GameStatus.FINISHED) return;
    const firstPlayer = this.firstPlayerProgress.answers.length === 5;
    const secondPlayer = this.secondPlayerProgress!.answers.length === 5;
    if (firstPlayer && secondPlayer) {
      this.status = GameStatus.FINISHED;
      this.finishGameDate = new Date();

      const p1 = new Date(
        this.firstPlayerProgress.answers[4].addedAt,
      ).getTime();

      const p2 = new Date(
        this.secondPlayerProgress!.answers[4].addedAt,
      ).getTime();
      if (p1 < p2 && this.firstPlayerProgress.score > 0) {
        this.firstPlayerProgress.score += 1;
      } else if (p1 > p2 && this.secondPlayerProgress!.score > 0) {
        this.secondPlayerProgress!.score += 1;
      }
    }
  }
}
