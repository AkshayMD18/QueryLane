import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { AgentsService } from 'src/agents/agents.service';
import { PaginationDto } from 'src/dto/dto.pagination';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
  ) { }

  @Get('/')
  async getFiles(@Query() paginationDto: PaginationDto) {
    const { page, limit, groupId } = paginationDto;
    return this.fileService.getAllFiles(page, limit, groupId);
  }

  @Get('/columns/:name')
  async getColumns(@Param('name') name: string) {
    return this.fileService.getColumns(name);
  }

  @Get(':name')
  async getTableData(
    @Param('name')
    name: string,
    @Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.fileService.getTableData(name, page, limit);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() uploadFileDto: UploadFileDto,
  ) {
    return await this.fileService.parseAndSaveFile(file, uploadFileDto.name, uploadFileDto.groupId);
  }
}
