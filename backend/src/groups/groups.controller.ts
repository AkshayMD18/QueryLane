import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

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
}
