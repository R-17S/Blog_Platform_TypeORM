import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { PairGamesQueryRepository } from '../infrastructure/query/pair-games.query-repository';
import { CurrentUserId } from '../../../core/decorators/current-user-id.decorator';
import { MyStatisticViewModel } from './view-dto/statistic.view-dto';

@Controller('pair-game-quiz/users')
@UseGuards(JwtAuthGuard)
export class UsersQuizController {
  constructor(
    private readonly pairGamesQueryRepository: PairGamesQueryRepository,
  ) {}

  @Get('my-statistic')
  @HttpCode(HttpStatus.OK)
  async getMyStatistic(
    @CurrentUserId() userId: string,
  ): Promise<MyStatisticViewModel> {
    return this.pairGamesQueryRepository.getMyStatistic(userId);
  }
}
