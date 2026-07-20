import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { QueryService } from './query.service';
import type { QueryResponse } from 'src/types/types.query';
import { ExecuteQueryDto } from './dto/execute-query.dto';
import { GetQueriesDto } from './dto/get-queries.dto';
import { DeleteQueryDto } from './dto/delete-query.dto';

@Controller('query')
export class QueryController {
    constructor(private readonly queryService: QueryService) { }

    @Post()
    async executeQuery(@Body() executeQueryDto: ExecuteQueryDto) {
        const { query, tableName, userQuery } = executeQueryDto;
        const result = await this.queryService.executeAndStoreQuery(query, tableName, userQuery);
        return result;
    }

    @Get()
    async getAllQueriesForTable(@Query() getQueriesDto: GetQueriesDto) {
        const { tableName } = getQueriesDto;
        const queries = await this.queryService.getAllQueriesForTable(tableName);

        const results = await Promise.all(
            queries.map(async (q: any) => {
                const queryResponse: QueryResponse = {
                    SQLiteQuery: q.query,
                    tableName: q.tableName,
                    columns: q.columns || [],
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
} 
