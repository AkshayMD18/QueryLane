import { Database } from 'sqlite3';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const dir = join(process.cwd(), 'databases');
const app = new Database(join(dir, 'app.sqlite'));
const run = (db: Database, sql: string, params: unknown[] = []) =>
  new Promise<void>((resolve, reject) =>
    db.run(sql, params, (e) => (e ? reject(e) : resolve())),
  );
const all = <T = Record<string, any>>(
  db: Database,
  sql: string,
  params: unknown[] = [],
) =>
  new Promise<T[]>((resolve, reject) =>
    db.all(sql, params, (e, rows) =>
      e ? reject(e) : resolve((rows ?? []) as T[]),
    ),
  );
const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function main() {
  await mkdir(dir, { recursive: true });
  const groups = await all<{ id: number; name: string }>(
    app,
    'SELECT id, name FROM groups',
  );
  const columns = await all<{ name: string }>(app, 'PRAGMA table_info(groups)');
  if (!columns.some((c) => c.name === 'databasePath'))
    await run(app, 'ALTER TABLE groups ADD COLUMN databasePath TEXT');
  for (const group of groups) {
    const slug =
      group.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'group';
    const filename = `${slug}-${group.id}.sqlite`;
    const target = new Database(join(dir, filename));
    const tables = await all<{ tableName: string }>(
      app,
      'SELECT tableName FROM tables WHERE groupId = ?',
      [group.id],
    );
    for (const table of tables) {
      const schema = await all<{ sql: string }>(
        app,
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table.tableName],
      );
      if (schema[0]?.sql) {
        await run(target, schema[0].sql);
        const rows = await all<Record<string, unknown>>(
          app,
          `SELECT * FROM ${q(table.tableName)}`,
        );
        for (const row of rows) {
          const names = Object.keys(row);
          await run(
            target,
            `INSERT INTO ${q(table.tableName)} (${names.map(q).join(',')}) VALUES (${names.map(() => '?').join(',')})`,
            names.map((name) => row[name]),
          );
        }
      }
      await run(app, `DROP TABLE IF EXISTS ${q(table.tableName)}`);
    }
    await run(app, 'UPDATE groups SET databasePath = ? WHERE id = ?', [
      filename,
      group.id,
    ]);
    await new Promise<void>((resolve, reject) =>
      target.close((e) => (e ? reject(e) : resolve())),
    );
  }
  await new Promise<void>((resolve, reject) =>
    app.close((e) => (e ? reject(e) : resolve())),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
