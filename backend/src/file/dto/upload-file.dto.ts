import { IsNotEmpty, IsString, IsInt, IsNumber } from 'class-validator';

export class UploadFileDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    groupId: number;
}