import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { QueryService } from './query.service';
import type { QueryResponse } from 'src/types/types.query';

@Controller('query')
export class QueryController {
    constructor(private readonly queryService: QueryService) { }

    @Post()
    async executeQuery(@Body('query') query: QueryResponse, @Body('tableName') tableName: string, @Body('userQuery') userQuery: string) {
        const result = await this.queryService.executeAndStoreQuery(query, tableName, userQuery);
        return result;
    }

    @Get()
    async getAllQueriesForTable(@Query('tableName') tableName: string) {
        const queries = await this.queryService.getAllQueriesForTable(tableName);

        const results = await Promise.all(
            queries.map(async (q: any) => {
                const data = await this.queryService.executeQuery(q.query);
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
    async deleteQuery(@Query('id') id: number) {
        const result = await this.queryService.deleteQuery(id);
        return result;
    }
} 
