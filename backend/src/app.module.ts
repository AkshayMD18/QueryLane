import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TableModule } from './table/table.module';
import { LlmserviceModule } from './llmservice/llmservice.module';
import { AgentsModule } from './agents/agents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryModule } from './query/query.module';
import { GroupsModule } from './groups/groups.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    TableModule,
    LlmserviceModule,
    AgentsModule,
    QueryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'databases/app.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    GroupsModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
