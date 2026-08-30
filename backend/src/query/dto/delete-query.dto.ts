import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}
