import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { LlmserviceModule } from './llmservice/llmservice.module';
import { AgentsModule } from './agents/agents.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [FileModule, LlmserviceModule, AgentsModule, ConfigModule.forRoot({
    isGlobal: true,
  }), TypeOrmModule.forRoot({
    type: 'sqlite',
    database: 'db.sqlite',
    autoLoadEntities: true,
    synchronize: true,
  }),],
  controllers: [],
  providers: [],
})
export class AppModule { }

