import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateSelectQuery } from 'src/helper';
import type { QueryResponse } from 'src/types/types.query';

@Injectable()
export class QueryService {

    constructor(private readonly dataSource: DataSource) { }
    async executeAndStoreQuery(query: QueryResponse, tableName: string) {
        try {
            const validatedQuery = validateSelectQuery(query.SQLiteQuery);
            const result = await this.dataSource.query(validatedQuery);

            await this.dataSource
                .createQueryBuilder()
                .insert()
                .into("queries")
                .values({ tableName, query: query.SQLiteQuery, queryType: query.queryType })
                .execute();

            return result;
        } catch (error) {
            throw error;
        }
    }

    async executeQuery(query: string) {
        try {
            const validatedQuery = validateSelectQuery(query);
            const result = await this.dataSource.query(validatedQuery);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllQueriesForTable(tableName: string) {
        try {
            const result = await this.dataSource
                .createQueryBuilder()
                .select("*")
                .from("queries", "q")
                .where("q.tableName = :tableName", { tableName })
                .getRawMany();
            return result;
        } catch (error) {
            throw error;
        }
    }
}
