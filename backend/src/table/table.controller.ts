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
import { TableService } from './table.service';
import { PaginationDto } from 'src/dto/dto.pagination';
import { UploadTableDto } from './dto/upload-table.dto';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('/')
  async getTables(@Query() paginationDto: PaginationDto) {
    const { page, limit, groupId } = paginationDto;
    return this.tableService.getAllTables(page, limit, groupId);
  }

  @Get('/metadata/:id')
  async getTableMetadata(@Param('id') id: string) {
    return this.tableService.getTableById(+id);
  }

  @Get('/columns/:name')
  async getColumns(@Param('name') name: string) {
    return this.tableService.getColumns(name);
  }

  @Get(':name')
  async getTableData(
    @Param('name')
    name: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    return this.tableService.getTableData(name, page, limit);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadTable(
    @UploadedFile() file: Express.Multer.File,
    @Query() uploadTableDto: UploadTableDto,
  ) {
    return await this.tableService.parseAndSaveFile(
      file,
      uploadTableDto.name,
      uploadTableDto.groupId,
    );
  }
}
