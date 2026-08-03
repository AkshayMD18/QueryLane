import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UploadTableDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    groupId: number;
}
