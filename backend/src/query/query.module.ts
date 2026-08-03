import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryService } from './query.service';
import { QueryController } from './query.controller';
import { Queries, GroupQuery } from './entities/query.entity';
import { TableModule } from '../table/table.module';

@Module({
    imports: [TypeOrmModule.forFeature([Queries, GroupQuery]), TableModule],
    controllers: [QueryController],
    providers: [QueryService],
    exports: [QueryService],
})
export class QueryModule { }
