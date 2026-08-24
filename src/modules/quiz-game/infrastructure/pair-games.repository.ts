import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameStatus, PairGameEntity } from '../domain/quizGame.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PairGameRepository {
  constructor(
    @InjectRepository(PairGameEntity)
    private readonly pGRepo: Repository<PairGameEntity>,
  ) {}

  async save(game: PairGameEntity): Promise<PairGameEntity> {
    return this.pGRepo.save(game);
  }

  async findPendingGame(): Promise<PairGameEntity | null> {
    return this.pGRepo.findOne({
      where: { status: GameStatus.PENDING_SECOND_PLAYER },
      order: { pairCreatedDate: 'ASC' },
    });
  }

  async findGameById(id: string): Promise<PairGameEntity | null> {
    return this.pGRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.questions', 'q')
      .where('g.id = :id', { id })
      .getOne();
  }

  async findUnfinishedGameByUserId(
    userId: string,
  ): Promise<PairGameEntity | null> {
    return this.pGRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.questions', 'q')
      .where('g.status IN (:status1, :status2)', {
        status1: GameStatus.PENDING_SECOND_PLAYER,
        status2: GameStatus.ACTIVE,
      })
      .andWhere('(fpUser.id = :userId OR spUser.id = :userId)', { userId })
      .getOne();
  }
}
