import { Body, Controller, Delete, Get, Post, Query, BadRequestException } from '@nestjs/common';
import { QueryService } from './query.service';
import type { QueryResponse } from 'src/types/types.query';
import { ExecuteQueryDto } from './dto/execute-query.dto';
import { GetQueriesDto } from './dto/get-queries.dto';
import { DeleteQueryDto } from './dto/delete-query.dto';
import { ExecuteGroupQueryDto } from './dto/execute-group-query.dto';
import { GetGroupQueriesDto } from './dto/get-group-queries.dto';
import { TableService } from '../table/table.service';

@Controller('query')
export class QueryController {
    constructor(
        private readonly queryService: QueryService,
        private readonly tableService: TableService,
    ) { }

    @Post()
    async executeQuery(@Body() executeQueryDto: ExecuteQueryDto) {
        const { query, tableId, userQuery } = executeQueryDto;
        const result = await this.queryService.executeAndStoreQuery(query, tableId, userQuery);
        return result;
    }

    @Get()
    async getAllQueriesForTable(@Query() getQueriesDto: GetQueriesDto) {
        const { tableId } = getQueriesDto;
        const table = await this.tableService.getTableById(tableId);
        if (!table) {
            throw new BadRequestException('Table not found');
        }

        const queries = await this.queryService.getAllQueriesForTable(tableId);

        const results = await Promise.all(
            queries.map(async (q: any) => {
                const queryResponse: QueryResponse = {
                    SQLiteQuery: q.query,
                    tableName: table.tableName,
                    queryType: q.queryType,
                };
                const data = await this.queryService.executeQuery(queryResponse);
                return {
                    id: q.id,
                    userQuery: q.userQuery,
                    query: q.query,
                    queryType: q.queryType,
                    data: data
                };
            })
        );

        return results;
    }

    @Delete()
    async deleteQuery(@Query() deleteQueryDto: DeleteQueryDto) {
        const { id } = deleteQueryDto;
        const result = await this.queryService.deleteQuery(id);
        return result;
    }

    @Post('group')
    async executeGroupQuery(@Body() executeGroupQueryDto: ExecuteGroupQueryDto) {
        const { query, groupId, userQuery } = executeGroupQueryDto;
        const result = await this.queryService.executeAndStoreGroupQuery(query, groupId, userQuery);
        return result;
    }

    @Get('group')
    async getAllQueriesForGroup(@Query() getGroupQueriesDto: GetGroupQueriesDto) {
        const { groupId } = getGroupQueriesDto;
        const tablesData = await this.tableService.getAgentGroupData(groupId);
        if (!tablesData || tablesData.length === 0) {
            throw new BadRequestException('No tables found for this group');
        }
        const allowedTables = tablesData.map(t => t.tableName);

        const queries = await this.queryService.getAllQueriesForGroup(groupId);

        const results = await Promise.all(
            queries.map(async (q: any) => {
                const data = await this.queryService.executeGroupQuery(q.query, allowedTables);
                return {
                    id: q.id,
                    userQuery: q.userQuery,
                    query: q.query,
                    queryType: q.queryType,
                    data: data
                };
            })
        );

        return results;
    }

    @Delete('group')
    async deleteGroupQuery(@Query() deleteQueryDto: DeleteQueryDto) {
        const { id } = deleteQueryDto;
        const result = await this.queryService.deleteGroupQuery(id);
        return result;
    }
} 
