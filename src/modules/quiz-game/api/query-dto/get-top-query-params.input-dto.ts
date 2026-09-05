import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { IsOptional } from 'class-validator';

export class GetTopUsersQueryParams extends BaseQueryParams {
  @IsOptional()
  sort?: string | string[];
}
