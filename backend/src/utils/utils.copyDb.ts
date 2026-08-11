import { Client } from 'pg';
import { Database } from 'sqlite3';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rename, unlink } from 'node:fs/promises';

export interface CopyDbOptions {
  connectionString: string;
  databaseName?: string;
  schema?: string;
  omitTables?: string[];
  sqlitePath: string;
  batchSize?: number;
  onProgress?: (progress: {
    table: string;
    rows: number;
    totalRows: number;
  }) => void;
  /** Keep the existing SQLite file (used by the application database). */
  preserveExisting?: boolean;
}

type Column = {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: number;
};
type Table = {
  name: string;
  columns: Column[];
  foreignKeys: { column: string; table: string; refColumn: string }[];
  indexes: string[];
  count: number;
};

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const valid = (s: string, what: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s))
    throw new Error(`Invalid ${what}: ${s}`);
};
const log = (message: string, details?: Record<string, unknown>) =>
  console.log(
    `[postgres-snapshot] ${new Date().toISOString()} ${message}`,
    details ?? '',
  );

function run(db: Database, sql: string, params: unknown[] = []) {
  return new Promise<void>((resolve, reject) =>
    db.run(sql, params, (e) => (e ? reject(e) : resolve())),
  );
}
function all<T = any>(db: Database, sql: string, params: unknown[] = []) {
  return new Promise<T[]>((resolve, reject) =>
    db.all(sql, params, (e, rows) => (e ? reject(e) : resolve(rows as T[]))),
  );
}
function close(db: Database) {
  return new Promise<void>((resolve, reject) =>
    db.close((e) => (e ? reject(e) : resolve())),
  );
}
function pgType(type: string) {
  if (['smallint', 'integer', 'bigint', 'boolean'].includes(type))
    return 'INTEGER';
  if (['real', 'double precision', 'numeric', 'decimal'].includes(type))
    return 'REAL';
  if (type === 'bytea') return 'BLOB';
  return 'TEXT';
}
function value(v: unknown, type: string): unknown {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return v;
  if (type === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'bigint') {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : String(v);
  }
  return v;
}

/** Copies a PostgreSQL schema and its data into a newly-built SQLite file.
 * The old target is never touched until schema, data, indexes and validation pass.
 */
export async function copyPostgresToSqlite(options: CopyDbOptions) {
  const schema = options.schema ?? 'public';
  const batchSize = Math.max(1, options.batchSize ?? 1000);
  valid(schema, 'schema');
  for (const t of options.omitTables ?? []) valid(t, 'table');
  const omitted = new Set(options.omitTables ?? []);
  const pg = new Client({
    connectionString: options.connectionString,
    database: options.databaseName,
  });
  const temp = `${options.sqlitePath}.${randomUUID()}.tmp`;
  let db: Database | undefined;
  let old: string | undefined;
  try {
    log('Starting snapshot', {
      schema,
      batchSize,
      sqlitePath: options.sqlitePath,
      preserveExisting: !!options.preserveExisting,
    });
    log('Connecting to PostgreSQL');
    await pg.connect();
    log('Connected to PostgreSQL');
    const identity = (
      await pg.query<{ database: string; user: string; host: string | null }>(
        'SELECT current_database() AS database, current_user AS user, inet_server_addr()::text AS host',
      )
    ).rows[0];
    log('PostgreSQL connection identity', {
      database: identity?.database,
      user: identity?.user,
      host: identity?.host,
      requestedDatabase: options.databaseName,
      requestedSchema: schema,
    });
    const tables = (
      await pg.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_type='BASE TABLE' ORDER BY table_name`,
        [schema],
      )
    ).rows.filter((t) => !omitted.has(t.table_name));
    log('Discovered tables', {
      count: tables.length,
      tables: tables.map((t) => t.table_name),
    });
    const metadata: Table[] = [];
    for (const t of tables) {
      log('Reading table metadata', { table: t.table_name });
      const cols = (
        await pg.query(
          `SELECT c.column_name,c.data_type,c.is_nullable,COALESCE(k.ordinality,0) primary_key FROM information_schema.columns c LEFT JOIN (SELECT ku.column_name, array_position(array_agg(ku.column_name),ku.column_name) ordinality FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage ku ON ku.constraint_name=tc.constraint_name AND ku.table_schema=tc.table_schema WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema=$1 AND tc.table_name=$2 GROUP BY ku.column_name) k ON k.column_name=c.column_name WHERE c.table_schema=$1 AND c.table_name=$2 ORDER BY c.ordinal_position`,
          [schema, t.table_name],
        )
      ).rows;
      const fks = (
        await pg.query(
          `SELECT kcu.column_name column,ccu.table_name table,ccu.column_name "refColumn" FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema=$1 AND tc.table_name=$2`,
          [schema, t.table_name],
        )
      ).rows.filter((x: any) => !omitted.has(x.table));
      const indexes = (
        await pg.query<{ indexdef: string }>(
          `SELECT indexdef FROM pg_indexes WHERE schemaname=$1 AND tablename=$2 AND indexdef NOT LIKE '%UNIQUE%'`,
          [schema, t.table_name],
        )
      ).rows.map((x) => x.indexdef);
      const count = Number(
        (
          await pg.query(
            `SELECT COUNT(*)::text count FROM ${q(schema)}.${q(t.table_name)}`,
          )
        ).rows[0].count,
      );
      metadata.push({
        name: t.table_name,
        columns: cols.map((c) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          primaryKey: Number(c.primary_key),
        })),
        foreignKeys: fks,
        indexes,
        count,
      });
      log('Table metadata recorded', {
        table: t.table_name,
        columns: cols.length,
        foreignKeys: fks.length,
        indexes: indexes.length,
        rows: count,
      });
    }
    const target = options.preserveExisting ? options.sqlitePath : temp;
    log('Creating SQLite target', { target });
    db = new Database(target);
    await run(db, 'PRAGMA foreign_keys=OFF');
    await run(db, 'PRAGMA journal_mode=WAL');
    for (const t of metadata) {
      const cols = t.columns.map(
        (c) =>
          `${q(c.name)} ${pgType(c.type)}${c.primaryKey ? ' PRIMARY KEY' : ''}${!c.nullable && !c.primaryKey ? ' NOT NULL' : ''}`,
      );
      const foreignKeys = t.foreignKeys.map(
        (f) =>
          `FOREIGN KEY (${q(f.column)}) REFERENCES ${q(f.table)} (${q(f.refColumn)})`,
      );
      await run(
        db,
        `CREATE TABLE ${q(t.name)} (${[...cols, ...foreignKeys].join(',')})`,
      );
    }
    for (const t of metadata) {
      const names = t.columns.map((c) => c.name);
      const sql = `INSERT INTO ${q(t.name)} (${names.map(q).join(',')}) VALUES (${names.map(() => '?').join(',')})`;
      let offset = 0;
      let batch = 0;
      log('Starting table migration', { table: t.name, totalRows: t.count });
      while (offset < t.count) {
        batch++;
        const rows = (
          await pg.query(
            `SELECT ${names.map(q).join(',')} FROM ${q(schema)}.${q(t.name)} OFFSET $1 LIMIT $2`,
            [offset, batchSize],
          )
        ).rows;
        await run(db, 'BEGIN');
        try {
          for (const row of rows)
            await run(
              db,
              sql,
              names.map((n) =>
                value(row[n], t.columns.find((c) => c.name === n)!.type),
              ),
            );
          await run(db, 'COMMIT');
        } catch (e) {
          await run(db, 'ROLLBACK').catch(() => undefined);
          log('Table batch failed', {
            table: t.name,
            batch,
            offset,
            error: e instanceof Error ? e.message : String(e),
          });
          throw e;
        }
        offset += rows.length;
        log('Migrated table batch', {
          table: t.name,
          batch,
          rowsInBatch: rows.length,
          migratedRows: offset,
          totalRows: t.count,
        });
        options.onProgress?.({
          table: t.name,
          rows: offset,
          totalRows: t.count,
        });
        if (!rows.length) break;
      }
      log('Finished table migration', {
        table: t.name,
        migratedRows: offset,
        expectedRows: t.count,
      });
    }
    for (const t of metadata)
      for (const index of t.indexes) {
        const sqliteIndex = index
          .replace(/^CREATE INDEX\s+/i, 'CREATE INDEX IF NOT EXISTS ')
          .replace(
            new RegExp(`ON\\s+${schema}\\.${t.name}`, 'i'),
            `ON ${q(t.name)}`,
          )
          .replace(/\s+USING\s+[A-Za-z0-9_]+/i, '');
        await run(db, sqliteIndex);
        log('Created SQLite index', { table: t.name });
      }
    await run(db, 'PRAGMA foreign_keys=ON');
    const violations = await all<any>(db, 'PRAGMA foreign_key_check');
    if (violations.length) {
      const details = violations
        .slice(0, 10)
        .map(
          (v) =>
            `${v.table}${v.rowid == null ? '' : ` row ${v.rowid}`} -> ${v.parent}`,
        )
        .join('; ');
      throw new Error(
        `Foreign-key validation failed (${violations.length} violation(s): ${details})`,
      );
    }
    for (const t of metadata) {
      const n = Number(
        (await all<any>(db, `SELECT COUNT(*) count FROM ${q(t.name)}`))[0]
          .count,
      );
      if (n !== t.count)
        throw new Error(
          `Row-count validation failed for ${t.name}: expected ${t.count}, got ${n}`,
        );
    }
    await close(db);
    db = undefined;
    if (!options.preserveExisting) {
      if (existsSync(options.sqlitePath)) {
        old = `${options.sqlitePath}.${randomUUID()}.old`;
        await rename(options.sqlitePath, old);
      }
      await rename(temp, options.sqlitePath);
      if (old) await unlink(old).catch(() => undefined);
    }
    return {
      databasePath: options.sqlitePath,
      tables: metadata.map((t) => ({ tableName: t.name, rowCount: t.count })),
    };
  } catch (e) {
    log('Snapshot failed', {
      error: e instanceof Error ? (e.stack ?? e.message) : String(e),
    });
    if (db) await close(db).catch(() => undefined);
    if (!options.preserveExisting) await unlink(temp).catch(() => undefined);
    throw e;
  } finally {
    await pg.end().catch(() => undefined);
    log('PostgreSQL connection closed');
  }
}
