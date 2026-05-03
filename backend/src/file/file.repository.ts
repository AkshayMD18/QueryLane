import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateTableName } from 'src/helper';

@Injectable()
export class FileRepository {
    constructor(private readonly dataSource: DataSource) { }

    async fetchTableDetails(tableName: string) {
        const validatedName = validateTableName(tableName);
        // 1. Get Columns (Must stay raw for SQLite metadata)
        const rawColumns = await this.dataSource.query(
            `PRAGMA table_info("${validatedName}")`
        );

        // 2. Get Sample Data (Top 3)
        const sampleData = await this.dataSource.query(
            `SELECT * FROM "${validatedName}" LIMIT 3`
        );

        // 3. Get Row Count using a raw query (getCount() requires an Entity)
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
