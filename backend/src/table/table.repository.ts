import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateTableName } from 'src/helper';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TableRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly databases: DatabaseService,
  ) {}

  async fetchTableDetails(databasePath: string, tableName: string) {
    const validatedName = validateTableName(tableName);

    const rawColumns = await this.databases.query(
      databasePath,
      `PRAGMA table_info("${validatedName}")`,
    );

    const sampleData = await this.databases.query(
      databasePath,
      `SELECT * FROM "${validatedName}" LIMIT 2`,
    );

    const countResult = await this.databases.query<{ count: string }>(
      databasePath,
      `SELECT COUNT(*) as count FROM "${validatedName}"`,
    );
    const rowCount = parseInt(countResult[0].count, 10);

    return {
      tableName,
      rawColumns,
      sampleData,
      rowCount,
    };
  }

  async getTableData(
    databasePath: string,
    tableName: string,
    page: number,
    limit: number,
  ) {
    const validatedName = validateTableName(tableName);
    const offset = page * limit;

    const data = await this.databases.query(
      databasePath,
      `SELECT * FROM "${validatedName}" LIMIT ${limit} OFFSET ${offset}`,
    );

    const countResult = await this.databases.query<{ count: string }>(
      databasePath,
      `SELECT COUNT(*) as count FROM "${validatedName}"`,
    );
    const total = parseInt(countResult[0].count, 10);

    return {
      data,
      total,
    };
  }

  async createDynamicTable(
    databasePath: string,
    tableName: string,
    columnDefs: string,
  ) {
    const validatedName = validateTableName(tableName);
    await this.databases.run(
      databasePath,
      `
            CREATE TABLE IF NOT EXISTS "${validatedName}" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ${columnDefs}
            )
        `,
    );
  }

  async insertDataBatch(
    databasePath: string,
    tableName: string,
    colNames: string,
    rowsSql: string,
    values: any[],
  ) {
    const validatedName = validateTableName(tableName);
    await this.databases.run(
      databasePath,
      `INSERT INTO "${validatedName}" (${colNames}) VALUES ${rowsSql}`,
      values,
    );
  }
}
