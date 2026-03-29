import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { AgentPlanner } from '../agents/agent.planner';

@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly agentPlanner: AgentPlanner,
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const data = await this.fileService.parseFile(file);
    return this.agentPlanner.generateAnalysisTasks(data);
  }
}
