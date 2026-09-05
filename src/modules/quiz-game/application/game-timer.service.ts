import { Injectable } from '@nestjs/common';
import { PairGameRepository } from '../infrastructure/pair-games.repository';
import { GameStatus } from '../domain/quizGame.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class GameTimerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pairGameRepository: PairGameRepository) {}

  start10SecondsTimer(gameId: string): void {
    setTimeout(async () => {
      try {
        return this.dataSource.transaction(async (manager) => {
          const game = await this.pairGameRepository.findGameById(
            gameId,
            manager,
          );
          if (game && game.status === GameStatus.ACTIVE) {
            game.finishByTimeout();
            await this.pairGameRepository.save(game, manager);
          }
        });
      } catch (e) {
        console.error(`Error finishing game ${gameId} by timeout:`, e);
      }
    }, 10000);
  }
}
