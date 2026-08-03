import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateSelectQuery } from 'src/helper';
import type { QueryResponse } from 'src/types/types.query';
import { TableService } from '../table/table.service';

@Injectable()
export class QueryService {

    constructor(
        private readonly dataSource: DataSource,
        private readonly tableService: TableService,
    ) { }

    async executeAndStoreQuery(query: QueryResponse, tableId: number, userQuery: string) {
        try {
            const table = await this.tableService.getTableById(tableId);
            if (!table) {
                throw new BadRequestException('Table not found');
            }

            const validatedQuery = validateSelectQuery(query.SQLiteQuery, table.tableName);
            const result = await this.dataSource.query(validatedQuery);

            await this.dataSource
                .createQueryBuilder()
                .insert()
                .into("queries")
                .values({ tableId, query: query.SQLiteQuery, queryType: query.queryType, userQuery })
                .execute();

            return result;
        } catch (error) {
            throw error;
        }
    }

    async executeQuery(query: QueryResponse) {
        try {
            const validatedQuery = validateSelectQuery(query.SQLiteQuery, query.tableName);
            const result = await this.dataSource.query(validatedQuery);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllQueriesForTable(tableId: number) {
        try {
            const result = await this.dataSource
                .createQueryBuilder()
                .select("*")
                .from("queries", "q")
                .where("q.tableId = :tableId", { tableId })
                .getRawMany();
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteQuery(id: number) {
        try {
            await this.dataSource
                .createQueryBuilder()
                .delete()
                .from("queries")
                .where("id = :id", { id })
                .execute();
        } catch (error) {
            throw error;
        }
    }
}
