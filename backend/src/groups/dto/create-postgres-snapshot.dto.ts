import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostgresSnapshotDto {
  @IsNotEmpty()
  @IsString()
  databaseName: string;

  @IsNotEmpty()
  @IsString()
  schemaName: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedTables?: string[];
}
