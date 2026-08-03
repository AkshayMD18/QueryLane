import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TableModule } from './table/table.module';
import { LlmserviceModule } from './llmservice/llmservice.module';
import { AgentsModule } from './agents/agents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryModule } from './query/query.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [TableModule, LlmserviceModule, AgentsModule, QueryModule, ConfigModule.forRoot({
    isGlobal: true,
  }), TypeOrmModule.forRoot({
    type: 'sqlite',
    database: 'db.sqlite',
    autoLoadEntities: true,
    synchronize: true,
  }), GroupsModule,],
  controllers: [],
  providers: [],
})
export class AppModule { }
