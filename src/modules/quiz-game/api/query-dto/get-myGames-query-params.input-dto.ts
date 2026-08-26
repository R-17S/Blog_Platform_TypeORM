import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { IsOptional, IsString } from 'class-validator';

export class GetMyGamesQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  sortBy: string = 'pairCreatedDate';
}
