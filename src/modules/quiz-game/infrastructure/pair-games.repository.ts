import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameStatus, PairGameEntity } from '../domain/quizGame.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PairGameRepository {
  constructor(
    @InjectRepository(PairGameEntity)
    private readonly pGRepo: Repository<PairGameEntity>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PairGameEntity> {
    return manager ? manager.getRepository(PairGameEntity) : this.pGRepo;
  }

  async save(
    game: PairGameEntity,
    manager?: EntityManager,
  ): Promise<PairGameEntity> {
    return this.getRepo(manager).save(game);
  }

  async findPendingGame(
    manager?: EntityManager,
  ): Promise<PairGameEntity | null> {
    return this.getRepo(manager).findOne({
      where: { status: GameStatus.PENDING_SECOND_PLAYER },
      order: { pairCreatedDate: 'ASC' },
      lock: manager ? { mode: 'pessimistic_write' } : undefined,
    });
  }

  async findGameById(
    id: string,
    manager?: EntityManager,
  ): Promise<PairGameEntity | null> {
    const qb = this.getRepo(manager)
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
      .where('g.id = :id', { id });

    if (manager) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }

  async findUnfinishedGameByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<PairGameEntity | null> {
    const qb = this.getRepo(manager)
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
      .where('g.status IN (:status1, :status2)', {
        status1: GameStatus.PENDING_SECOND_PLAYER,
        status2: GameStatus.ACTIVE,
      })
      .andWhere('(fpUser.id = :userId OR spUser.id = :userId)', { userId });

    if (manager) {
      qb.setLock('pessimistic_write');
    }

    return qb.getOne();
  }
}
