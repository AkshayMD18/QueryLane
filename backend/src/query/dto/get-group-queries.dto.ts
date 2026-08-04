import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class GetGroupQueriesDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    groupId: number;
}
