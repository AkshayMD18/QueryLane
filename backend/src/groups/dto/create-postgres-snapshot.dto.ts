import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePostgresSnapshotDto {
  @IsNotEmpty()
  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  port: number;

  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  databaseName: string;

  @IsNotEmpty()
  @IsString()
  schemaName: string;

  @IsOptional()
  @IsString()
  connectionString?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedTables?: string[];
}
