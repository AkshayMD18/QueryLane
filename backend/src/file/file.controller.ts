import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { AgentPlanner } from '../agents/agent.planner';
import { PaginationDto } from 'src/dto/dto.pagination';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly agentPlanner: AgentPlanner,
  ) { }

  @Get('/')
  async getFiles() {
    return this.fileService.getAllFiles();
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
    @Query('name') name: string,
  ) {
    return await this.fileService.parseAndSaveFile(file, name);
  }
}
