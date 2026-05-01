import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateSelectQuery } from 'src/helper';

@Injectable()
export class QueryService {

    constructor(private readonly dataSource: DataSource) { }
    async executeQuery(query: string) {
        try {
            const validatedQuery = validateSelectQuery(query);
            const result = await this.dataSource.query(validatedQuery);
            return result;
        } catch (error) {
            throw error;
        }
    }
}
