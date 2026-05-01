import { Body, Controller, Get, Post } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
    constructor(private readonly queryService: QueryService) { }

    @Post()
    async executeQuery(@Body('query') query: string, @Body('tableName') tableName: string) {
        const result = await this.queryService.executeAndStorQuery(query, tableName);
        return result;
    }

    @Get()
    async getAllQueriesForTable(@Body('tableName') tableName: string) {
        const queries = await this.queryService.getAllQueriesForTable(tableName);

        const results = await Promise.all(
            queries.map(async (q: any) => {
                const data = await this.queryService.executeQuery(q.query);
                return {
                    query: q.query,
                    data: data

                };
            })
        );

        return results;
    }
} 
