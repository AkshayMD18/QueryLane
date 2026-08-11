import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreatePostgresSnapshotDto } from './dto/create-postgres-snapshot.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(createGroupDto.name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.getGroupById(+id);
  }

  @Get()
  findMany() {
    return this.groupsService.getAllGroups();
  }

  @Post('postgres-snapshot')
  createPostgresSnapshot(@Body() snapshotDto: CreatePostgresSnapshotDto) {
    return this.groupsService.getSnapshot(
      snapshotDto.databaseName,
      snapshotDto.schemaName,
      snapshotDto.excludedTables ?? [],
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.deleteGroup(+id);
  }
}
