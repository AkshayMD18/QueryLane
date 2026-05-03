import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { FileService } from 'src/file/file.service';

@Controller('agents')
export class AgentsController {
    constructor(
        private readonly agentsService: AgentsService,
        private readonly fileService: FileService,
    ) { }

    @Get('generate-tasks')
    async generateTasks(@Query('tableName') tableName: string) {
        const data = await this.fileService.getAgentTableData(tableName);
        return this.agentsService.generateAnalysisTasks(data);
    }

    @Post('query')
    async query(@Body('tableName') tableName: string, @Body('query') query: string) {
        const data = await this.fileService.getAgentTableData(tableName);
        return this.agentsService.generateQuery({ ...data, query });
    }
}
