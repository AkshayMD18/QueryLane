import { Module } from '@nestjs/common';
import { LlmserviceService } from './llmservice.service';

@Module({
  providers: [LlmserviceService],
  exports: [LlmserviceService],
})
export class LlmserviceModule {}
