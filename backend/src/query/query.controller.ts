import { Body, Controller, Post } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
    constructor(private readonly queryService: QueryService) { }

    @Post()
    async executeQuery(@Body('query') query: string, @Body('tableName') tableName: string) {
        const result = await this.queryService.executeAndStorQuery(query, tableName);
        return result;
    }
} 
