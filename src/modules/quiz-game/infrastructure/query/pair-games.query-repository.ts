import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameStatus, PairGameEntity } from '../../domain/quizGame.entity';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GameMapper, GameViewModel } from '../../api/view-dto/game.view-dto';
import { isUUID } from 'class-validator';

@Injectable()
export class PairGamesQueryRepository {
  constructor(
    @InjectRepository(PairGameEntity)
    private readonly pGQueryRepo: Repository<PairGameEntity>,
  ) {}

  async getMyCurrentGame(userId: string): Promise<GameViewModel> {
    const game = await this.pGQueryRepo
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

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'No active pair',
      });
    }
    return GameMapper.toView(game);
  }

  async getGameById(id: string, currentUserId: string): Promise<GameViewModel> {
    if (!isUUID(id) || !isUUID(currentUserId)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid id format',
      });
    }

    const game = await this.pGQueryRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.questions', 'q')
      .where('g.id = :id', { id })
      .getOne();

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'No active pair',
      });
    }

    const isFirstPlayer =
      game.firstPlayerProgress?.player?.id === currentUserId;
    const isSecondPlayer =
      game.secondPlayerProgress?.player?.id === currentUserId;

    if (!isFirstPlayer && !isSecondPlayer) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You are not a participant of this game',
      });
    }

    return GameMapper.toView(game);
  }
}
