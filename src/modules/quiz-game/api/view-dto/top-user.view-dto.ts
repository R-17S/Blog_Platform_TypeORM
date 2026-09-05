import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';


export class TopUserPlayerViewModel {
  id: string;
  login: string;
}

export class TopUserViewModel {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  player: TopUserPlayerViewModel;
}

export class TopUsersViewPaginated extends PaginatedViewDto<
  TopUserViewModel[]
> {}
