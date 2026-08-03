import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { TableRepository } from './table.repository';
import { AgentsModule } from '../agents/agents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableEntity } from './entities/table.entity';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [AgentsModule, TypeOrmModule.forFeature([TableEntity]), GroupsModule],
  controllers: [TableController],
  providers: [TableService, TableRepository],
  exports: [TableService, TableRepository],
})
export class TableModule { }
