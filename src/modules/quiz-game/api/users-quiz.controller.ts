import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { PairGamesQueryRepository } from '../infrastructure/query/pair-games.query-repository';
import { CurrentUserId } from '../../../core/decorators/current-user-id.decorator';
import { MyStatisticViewModel } from './view-dto/statistic.view-dto';
import { GetTopUsersQueryParams } from './query-dto/get-top-query-params.input-dto';
import { TopUsersViewPaginated } from './view-dto/top-user.view-dto';

@Controller('pair-game-quiz/users')
export class UsersQuizController {
  constructor(
    private readonly pairGamesQueryRepository: PairGamesQueryRepository,
  ) {}

  @Get('my-statistic')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getMyStatistic(
    @CurrentUserId() userId: string,
  ): Promise<MyStatisticViewModel> {
    return this.pairGamesQueryRepository.getMyStatistic(userId);
  }

  @Get('top')
  @HttpCode(HttpStatus.OK)
  async getTopUsers(
    @Query() query: GetTopUsersQueryParams,
  ): Promise<TopUsersViewPaginated> {
    return this.pairGamesQueryRepository.getTopUsers(query);
  }
}
