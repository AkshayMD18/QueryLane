import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateTableName } from 'src/helper';

@Injectable()
export class FileRepository {
    constructor(private readonly dataSource: DataSource) { }

    async fetchTableDetails(tableName: string) {
        const validatedName = validateTableName(tableName);

        const rawColumns = await this.dataSource.query(
            `PRAGMA table_info("${validatedName}")`
        );

        const sampleData = await this.dataSource.query(
            `SELECT * FROM "${validatedName}" LIMIT 2`
        );

        const countResult = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM "${validatedName}"`
        );
        const rowCount = parseInt(countResult[0].count, 10);

        return {
            tableName,
            rawColumns,
            sampleData,
            rowCount,
        };
    }

    async getTableData(tableName: string, page: number, limit: number) {
        const validatedName = validateTableName(tableName);
        const offset = page * limit;

        const data = await this.dataSource.query(
            `SELECT * FROM "${validatedName}" LIMIT ${limit} OFFSET ${offset}`
        );

        const countResult = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM "${validatedName}"`
        );
        const total = parseInt(countResult[0].count, 10);

        return {
            data,
            total,
        };
    }

    async createDynamicTable(tableName: string, columnDefs: string) {
        const validatedName = validateTableName(tableName);
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS "${validatedName}" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ${columnDefs}
            )
        `);
    }

    async insertDataBatch(tableName: string, colNames: string, rowsSql: string, values: any[]) {
        const validatedName = validateTableName(tableName);
        await this.dataSource.query(
            `INSERT INTO "${validatedName}" (${colNames}) VALUES ${rowsSql}`,
            values
        );
    }
}
