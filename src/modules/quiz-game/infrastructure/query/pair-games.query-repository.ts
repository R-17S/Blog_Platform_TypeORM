import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameStatus, PairGameEntity } from '../../domain/quizGame.entity';
import { Repository } from 'typeorm';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  GameMapper,
  GamesViewPaginated,
  GameViewModel,
} from '../../api/view-dto/game.view-dto';
import { isUUID } from 'class-validator';
import { GetMyGamesQueryParams } from '../../api/query-dto/get-myGames-query-params.input-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { MyStatisticViewModel } from '../../api/view-dto/statistic.view-dto';

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
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
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
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
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

  async getMyGames(
    userId: string,
    params: GetMyGamesQueryParams,
  ): Promise<GamesViewPaginated> {
    const game = this.pGQueryRepo
      .createQueryBuilder('g')
      .setFindOptions({ loadEagerRelations: false })
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q')
      .where('(fp.playerId = :userId OR sp.playerId = :userId)', { userId });

    const allowedSortBy = [
      'pairCreatedDate',
      'startGameDate',
      'finishGameDate',
      'status',
      'id',
    ];
    const sortBy = allowedSortBy.includes(params.sortBy)
      ? params.sortBy
      : 'pairCreatedDate';
    const sortDirection =
      params.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';
    game.orderBy(`g.${sortBy}`, sortDirection);
    if (sortBy !== 'pairCreatedDate') {
      game.addOrderBy('g.pairCreatedDate', 'DESC');
    }

    const offset = params.calculateSkip();
    const limit = params.pageSize;

    game.skip(offset).take(limit);
    const [games, totalCount] = await game.getManyAndCount();
    return GamesViewPaginated.mapToView({
      items: games.map((g) => GameMapper.toView(g)),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
    });
  }

  async getMyStatistic(userId: string): Promise<MyStatisticViewModel> {
    const finishGame = await this.pGQueryRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('fp.player', 'fpUser')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('sp.player', 'spUser')
      .where('g.status = :status', { status: GameStatus.FINISHED })
      .andWhere('(fpUser.id = :userId OR spUser.id = :userId)', { userId })
      .getMany();

    if (finishGame.length === 0) {
      return {
        sumScore: 0,
        avgScores: 0,
        gamesCount: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      };
    }
    let sumScore = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let drawsCount = 0;

    for (const game of finishGame) {
      const isFirstPlayer = game.firstPlayerProgress.player.id === userId;
      const myProgress = isFirstPlayer
        ? game.firstPlayerProgress
        : game.secondPlayerProgress!;
      const opponentProgress = isFirstPlayer
        ? game.secondPlayerProgress!
        : game.firstPlayerProgress;

      const myScore = myProgress.score;
      const opponentScore = opponentProgress.score;

      sumScore += myScore;

      if (myScore > opponentScore) {
        winsCount++;
      } else if (myScore < opponentScore) {
        lossesCount++;
      } else {
        drawsCount++;
      }
    }

    const gamesCount = finishGame.length;
    const rawAvg = gamesCount === 0 ? 0 : sumScore / gamesCount;
    const avgScores = Number(rawAvg.toFixed(2));

    return {
      sumScore,
      avgScores,
      gamesCount,
      winsCount,
      lossesCount,
      drawsCount,
    };
  }
}
