import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';


export enum PublishedStatus {
  ALL = 'all',
  PUBLISHED = 'published',
  NOT_PUBLISHED = 'notPublished',
}

export class QuestionsInputQuery extends BaseQueryParams {
  @IsOptional()
  @IsString()
  bodySearchTerm?: string;

  @IsOptional()
  @IsEnum(PublishedStatus)
  publishedStatus: PublishedStatus = PublishedStatus.ALL;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';
}
