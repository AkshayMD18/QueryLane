import { IsNotEmpty, IsString, IsEnum, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryResponseDto {
    @IsNotEmpty()
    @IsString()
    SQLiteQuery: string;

    @IsNotEmpty()
    @IsString()
    tableName: string;

    @IsNotEmpty()
    @IsEnum(['table', 'chart', 'value'])
    queryType: 'table' | 'chart' | 'value';
}

export class ExecuteQueryDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => QueryResponseDto)
    query: QueryResponseDto;

    @IsNotEmpty()
    @IsNumber()
    tableId: number;

    @IsNotEmpty()
    @IsString()
    userQuery: string;
}
