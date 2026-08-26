import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUserId } from '../../../core/decorators/current-user-id.decorator';
import {
  AnswerViewModel,
  GamesViewPaginated,
  GameViewModel,
} from './view-dto/game.view-dto';
import { PairGamesQueryRepository } from '../infrastructure/query/pair-games.query-repository';
import { ConnectToGameCommand } from '../application/connection-toGame.useCase';
import { SendAnswerCommand } from '../application/send-answer.useCase';
import { AnswerInputDto } from '../dto/answer-input.dto';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { GetMyGamesQueryParams } from './query-dto/get-myGames-query-params.input-dto';

@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class PairGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pairGamesQueryRepository: PairGamesQueryRepository,
  ) {}

  @Get('my-current')
  @HttpCode(HttpStatus.OK)
  async getMyCurrentGame(
    @CurrentUserId() userId: string,
  ): Promise<GameViewModel> {
    return this.pairGamesQueryRepository.getMyCurrentGame(userId);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyGames(
    @Query() query: GetMyGamesQueryParams,
    @CurrentUserId() userId: string,
  ): Promise<GamesViewPaginated> {
    return this.pairGamesQueryRepository.getMyGames(userId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGameById(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<GameViewModel> {
    return this.pairGamesQueryRepository.getGameById(id, userId);
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectToGame(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GameViewModel> {
    return this.commandBus.execute(new ConnectToGameCommand(user));
  }

  @Post('my-current/answers')
  @HttpCode(HttpStatus.OK)
  async sendAnswer(
    @Body() input: AnswerInputDto,
    @CurrentUserId() userId: string,
  ): Promise<AnswerViewModel> {
    return this.commandBus.execute(new SendAnswerCommand(userId, input.answer));
  }
}
