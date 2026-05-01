import { Controller, Post, Body } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { FileService } from 'src/file/file.service';

@Controller('agents')
export class AgentsController {
    constructor(
        private readonly agentsService: AgentsService,
        private readonly fileService: FileService,
    ) { }

    @Post('plan')
    async plan(@Body() body: { name: string }) {
        const data = await this.fileService.getAgentTableData(body.name);
        return this.agentsService.generateAnalysisTasks(data);
    }

    @Post('query')
    async query(@Body() body: { name: string, query: string }) {
        const data = await this.fileService.getAgentTableData(body.name);
        return this.agentsService.generateQuery({ ...data, query: body.query });
    }
}
