import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { AgentsModule } from '../agents/agents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from './file.entity';

@Module({
  imports: [AgentsModule, TypeOrmModule.forFeature([Files])],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule { }
