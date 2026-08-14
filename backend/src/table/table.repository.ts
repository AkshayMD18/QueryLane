import { Injectable } from '@nestjs/common';
import { validateTableName } from 'src/helper';
import { DatabaseService } from '../database/database.service';
import schemaInspector from 'knex-schema-inspector';

@Injectable()
export class TableRepository {
  constructor(private readonly databases: DatabaseService) {}

  async fetchTableDetails(databasePath: string, tableName: string) {
    const validatedName = validateTableName(tableName);

    const db = await this.databases.getKnex(databasePath);
    const columns = await schemaInspector(db).columnInfo(validatedName);
    const rawColumns = columns.map((column, index) => ({
      cid: index,
      name: column.name,
      type: column.data_type,
      notnull: column.is_nullable === false ? 1 : 0,
      dflt_value: column.default_value ?? null,
      pk: column.is_primary_key ? 1 : 0,
    }));

    const sampleData = await db(validatedName).select('*').limit(2);

    const countResult = await db(validatedName)
      .count<{ count: string }[]>('* as count')
      .first();
    const rowCount = Number(countResult?.count ?? 0);

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

    const db = await this.databases.getKnex(databasePath);
    const data = await db(validatedName)
      .select('*')
      .limit(limit)
      .offset(offset);

    const countResult = await db(validatedName)
      .count<{ count: string }[]>('* as count')
      .first();
    const total = Number(countResult?.count ?? 0);

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
