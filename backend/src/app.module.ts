import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { LlmserviceModule } from './llmservice/llmservice.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [FileModule, LlmserviceModule, AgentsModule, ConfigModule.forRoot({
    isGlobal: true,
  }),],
  controllers: [],
  providers: [],
})
export class AppModule { }

