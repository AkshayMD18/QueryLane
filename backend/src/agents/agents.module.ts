import { Module } from '@nestjs/common';
import { AgentPlanner } from './agent.planner';
import { LlmserviceModule } from '../llmservice/llmservice.module';

@Module({
  imports: [LlmserviceModule],
  providers: [AgentPlanner],
  exports: [AgentPlanner],
})
export class AgentsModule {}
