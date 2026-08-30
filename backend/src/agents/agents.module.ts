import { Module, forwardRef } from '@nestjs/common';
import { LlmserviceModule } from '../llmservice/llmservice.module';
import { AgentsService } from './agents.service';
import { TableModule } from '../table/table.module';
import { AgentsController } from './agents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [
    LlmserviceModule,
    forwardRef(() => TableModule),
    TypeOrmModule.forFeature([Group]),
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
