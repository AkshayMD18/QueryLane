import { IsNotEmpty, IsString } from 'class-validator';

export class GetQueriesDto {
    @IsNotEmpty()
    @IsString()
    tableName: string;
}
