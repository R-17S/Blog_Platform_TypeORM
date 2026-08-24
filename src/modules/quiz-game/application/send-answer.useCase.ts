import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PairGameRepository } from '../infrastructure/pair-games.repository';
import { AnswerViewModel } from '../api/view-dto/game.view-dto';
import { GameStatus } from '../domain/quizGame.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export class SendAnswerCommand {
  constructor(
    public readonly userId: string,
    public readonly answer: string,
  ) {}
}

@CommandHandler(SendAnswerCommand)
export class SendAnswerUseCase implements ICommandHandler<SendAnswerCommand> {
  constructor(private readonly pairGameRepository: PairGameRepository) {}

  async execute(command: SendAnswerCommand): Promise<AnswerViewModel> {
    const game = await this.pairGameRepository.findUnfinishedGameByUserId(
      command.userId,
    );
    if (!game || game.status !== GameStatus.ACTIVE) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Current user is not inside active game',
      });
    }
    const answerResult = game.sendAnswer(command.userId, command.answer);
    await this.pairGameRepository.save(game);

    return {
      questionId: answerResult.questionId,
      answerStatus: answerResult.answerStatus,
      addedAt: new Date(answerResult.addedAt).toISOString(),
    };
  }
}