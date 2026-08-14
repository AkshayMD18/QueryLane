import 'dotenv/config';
import knex, { Knex } from 'knex';
import schemaInspector from 'knex-schema-inspector';

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

    const db = knex({
      client: 'pg',
      connection: { ...POSTGRES_CONFIG, database: databaseName },
    });

    try {
      const inspector = schemaInspector(db);
      inspector.withSchema?.(schemaName);
      const tableNames = await inspector.tables();

      const tables: SnapshotTable[] = [];

      for (const tableName of tableNames) {
        if (excluded.has(tableName)) continue;

        const columns = await this.getColumns(inspector, tableName);
        const rowCountResult = await db
          .withSchema(schemaName)
          .from(tableName)
          .count<{ count: string }[]>('* as count')
          .first();

        const rows = await this.readRows(db, schemaName, tableName);

        tables.push({
          schemaName,
          tableName,
          columns,
          rowCount: Number(rowCountResult?.count ?? 0),
          rows,
        });
      }

      return { databaseName, schemaName, tables };
    } finally {
      await db.destroy();
    }
  }

  private async getColumns(
    inspector: ReturnType<typeof schemaInspector>,
    tableName: string,
  ) {
    const columns = await inspector.columnInfo(tableName);
    return columns.map((column) => ({
      name: column.name,
      sourceType: column.data_type,
      normalizedType: this.normalizeType(column.data_type),
      nullable: column.is_nullable,
    }));
  }

  private async readRows(db: Knex, schemaName: string, tableName: string) {
    return (await db
      .withSchema(schemaName)
      .from(tableName)
      .select('*')) as Record<string, unknown>[];
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
