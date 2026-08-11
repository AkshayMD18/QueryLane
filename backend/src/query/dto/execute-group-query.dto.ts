import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QueryResponseDto } from './execute-query.dto';

export class ExecuteGroupQueryDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => QueryResponseDto)
  query: QueryResponseDto;

  @IsNotEmpty()
  @IsNumber()
  groupId: number;

  @IsNotEmpty()
  @IsString()
  userQuery: string;
}
