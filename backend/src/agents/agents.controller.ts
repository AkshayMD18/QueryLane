import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { TableService } from '../table/table.service';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly tableService: TableService,
  ) {}

  @Get('generate-tasks')
  async generateTasks(@Query('tableName') tableName: string) {
    const data = await this.tableService.getAgentTableData(tableName);
    return this.agentsService.generateAnalysisTasks(data);
  }

  @Post('query')
  async query(
    @Body('tableName') tableName: string,
    @Body('query') query: string,
  ) {
    const data = await this.tableService.getAgentTableData(tableName);
    return this.agentsService.generateQuery({ ...data, query });
  }

  @Post('join-query')
  async joinQuery(
    @Body('groupId') groupId: string,
    @Body('query') query: string,
  ) {
    const tablesData = await this.tableService.getAgentGroupData(
      Number(groupId),
    );
    return this.agentsService.generateQueryForMultipleTables({
      tableData: tablesData,
      query: query,
      groupId: Number(groupId),
    });
  }
}
