import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGameRepository } from '../../infrastructure/pair-games.repository';
import { QuestionsRepository } from '../../infrastructure/questions.repository';
import { GameMapper, GameViewModel } from '../../api/view-dto/game.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { PairGameEntity } from '../../domain/quizGame.entity';
import { UserEntity } from '../../../user-accounts/domain/user.entity';
import { DataSource } from 'typeorm';

export class ConnectToGameCommand {
  constructor(public readonly user: { id: string; login: string }) {}
}

@CommandHandler(ConnectToGameCommand)
export class ConnectToGameUseCase
  implements ICommandHandler<ConnectToGameCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    public readonly pairGameRepository: PairGameRepository,
    private readonly questionsRepository: QuestionsRepository,
  ) {}

  async execute(command: ConnectToGameCommand): Promise<GameViewModel> {
    const user = command.user as UserEntity;
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_loct(123456)`);
      const activeGame =
        await this.pairGameRepository.findUnfinishedGameByUserId(
          user.id,
          manager,
        );
      if (activeGame) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'No active game',
        });
      }

      const pendingGame =
        await this.pairGameRepository.findPendingGame(manager);
      if (!pendingGame) {
        const game = PairGameEntity.create(user);
        const gameSave = await this.pairGameRepository.save(game, manager);
        return GameMapper.toView(gameSave);
      }

      const randomQuest = await this.questionsRepository.getRandomQuestions(5);
      if (randomQuest.length < 5) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'Not enough published questions in database to start game',
        });
      }
      pendingGame.connectSecondPlayer(user, randomQuest);
      const gameSave = await this.pairGameRepository.save(pendingGame, manager);
      return GameMapper.toView(gameSave);
    });
  }
}
