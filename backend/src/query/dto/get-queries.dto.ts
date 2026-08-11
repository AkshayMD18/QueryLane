import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class GetQueriesDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  tableId: number;
}
