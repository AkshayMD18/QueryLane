import { IsNotEmpty, IsString, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryResponseDto {
    @IsNotEmpty()
    @IsString()
    SQLiteQuery: string;

    @IsNotEmpty()
    @IsString()
    tableName: string;

    @IsArray()
    @IsString({ each: true })
    columns: string[];

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
    @IsString()
    tableName: string;

    @IsNotEmpty()
    @IsString()
    userQuery: string;
}
