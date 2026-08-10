import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

//базовый класс для query параметров с пагинацией
//значения по-умолчанию применятся автоматически при настройке глобального ValidationPipe в main.ts
export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class BaseQueryParams {
  //для трансформации в number
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 1 : Math.floor(num);
  })
  pageNumber: number = 1;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 10 : Math.floor(num);
  })
  pageSize: number = 10;
  @IsOptional()
  @IsEnum(SortDirection)
  @Type(() => String)
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }

  SortOptions(sortBy: string): Record<string, 1 | -1> {
    return {
      [sortBy]: this.sortDirection === SortDirection.Asc ? 1 : -1,
    };
  }
}
