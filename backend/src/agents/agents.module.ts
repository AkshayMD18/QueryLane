import { Module, forwardRef } from '@nestjs/common';
import { LlmserviceModule } from '../llmservice/llmservice.module';
import { AgentsService } from './agents.service';
import { FileModule } from '../file/file.module';
import { AgentsController } from './agents.controller';

@Module({
  imports: [LlmserviceModule, forwardRef(() => FileModule)],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule { }
