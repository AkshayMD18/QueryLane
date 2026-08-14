import 'dotenv/config';
import { Client } from 'pg';

const POSTGRES_CONFIG = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: String(process.env.POSTGRES_PASSWORD ?? ''),
  database: process.env.POSTGRES_DATABASE ?? '',
};

const POSTGRES_SCHEMA = process.env.POSTGRES_SCHEMA ?? 'public';
const EXCLUDED_TABLES = (process.env.POSTGRES_EXCLUDED_TABLES ?? '')
  .split(',')
  .map((table) => table.trim())
  .filter(Boolean);

export const getPostgresConfig = () => ({ ...POSTGRES_CONFIG });

function validatePostgresConfig() {
  if (
    !POSTGRES_CONFIG.password ||
    POSTGRES_CONFIG.password === 'your_postgres_password'
  ) {
    throw new Error(
      'POSTGRES_PASSWORD is missing or still set to the placeholder value. Set it in backend/.env and restart the server.',
    );
  }
}

export type SnapshotColumn = {
  name: string;
  sourceType: string;
  normalizedType: string;
  nullable: boolean;
};

export type SnapshotTable = {
  schemaName: string;
  tableName: string;
  columns: SnapshotColumn[];
  rowCount: number;
  rows: Record<string, unknown>[];
};

export type PostgresSnapshot = {
  databaseName: string;
  schemaName: string;
  tables: SnapshotTable[];
};

export class PostgresDbConnector {
  async createSnapshot(
    databaseName = POSTGRES_CONFIG.database,
    schemaName = POSTGRES_SCHEMA,
    excludedTables = EXCLUDED_TABLES,
  ): Promise<PostgresSnapshot> {
    validatePostgresConfig();
    this.validateIdentifier(schemaName, 'schema');

    const excluded = new Set(
      excludedTables.map((table) => {
        this.validateIdentifier(table, 'table');
        return table;
      }),
    );

    const client = new Client({ ...POSTGRES_CONFIG, database: databaseName });

    try {
      await client.connect();
      await client.query('SELECT 1');

      const tableResult = await client.query<{
        table_schema: string;
        table_name: string;
      }>(
        `SELECT table_schema, table_name
                 FROM information_schema.tables
                 WHERE table_schema = $1
                   AND table_type = 'BASE TABLE'
                 ORDER BY table_name`,
        [schemaName],
      );

      const tables: SnapshotTable[] = [];

      for (const table of tableResult.rows) {
        if (excluded.has(table.table_name)) continue;

        const columns = await this.getColumns(
          client,
          schemaName,
          table.table_name,
        );
        const rowCountResult = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
                     FROM ${this.quoteIdentifier(schemaName)}.${this.quoteIdentifier(table.table_name)}`,
        );

        const rows = await this.readRows(client, schemaName, table.table_name);

        tables.push({
          schemaName,
          tableName: table.table_name,
          columns,
          rowCount: Number(rowCountResult.rows[0]?.count ?? 0),
          rows,
        });
      }

      return { databaseName, schemaName, tables };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async getColumns(
    client: Client,
    schemaName: string,
    tableName: string,
  ) {
    const result = await client.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2
             ORDER BY ordinal_position`,
      [schemaName, tableName],
    );

    return result.rows.map((column) => ({
      name: column.column_name,
      sourceType: column.data_type,
      normalizedType: this.normalizeType(column.data_type),
      nullable: column.is_nullable === 'YES',
    }));
  }

  private async readRows(
    client: Client,
    schemaName: string,
    tableName: string,
  ) {
    const result = await client.query(
      `SELECT *
             FROM ${this.quoteIdentifier(schemaName)}.${this.quoteIdentifier(tableName)}`,
    );

    return result.rows as Record<string, unknown>[];
  }

  private normalizeType(type: string): string {
    if (['smallint', 'integer', 'bigint'].includes(type)) return 'integer';
    if (['numeric', 'decimal', 'real', 'double precision'].includes(type))
      return 'decimal';
    if (type === 'boolean') return 'boolean';
    if (type === 'date') return 'date';
    if (type.includes('timestamp') || type === 'time') return 'datetime';
    if (['json', 'jsonb'].includes(type)) return 'json';
    if (['bytea'].includes(type)) return 'binary';
    return 'string';
  }

  private quoteIdentifier(identifier: string): string {
    this.validateIdentifier(identifier, 'identifier');
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private validateIdentifier(identifier: string, kind: string): void {
    if (!identifier || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid PostgreSQL ${kind} name`);
    }
  }
}

export const postgresDbConnector = new PostgresDbConnector();
