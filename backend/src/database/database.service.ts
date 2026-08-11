import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from 'sqlite3';

export const DATABASES_DIR = join(process.cwd(), 'databases');

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly connections = new Map<string, Database>();
  path(filename: string) {
    return join(DATABASES_DIR, filename);
  }
  async ensureDirectory() {
    await mkdir(DATABASES_DIR, { recursive: true });
  }
  groupFilename(name: string, id: number) {
    const slug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'group';
    return `${slug}-${id}.sqlite`;
  }
  async open(filename: string) {
    const existing = this.connections.get(filename);
    if (existing) return existing;
    await this.ensureDirectory();
    const db = new Database(this.path(filename));
    this.connections.set(filename, db);
    return db;
  }
  async create(filename: string) {
    await this.ensureDirectory();
    const file = this.path(filename);
    if (!existsSync(file)) await writeFile(file, Buffer.alloc(0));
  }
  async close(filename: string) {
    const db = this.connections.get(filename);
    if (!db) return;
    await new Promise<void>((resolve, reject) =>
      db.close((error) => (error ? reject(error) : resolve())),
    );
    this.connections.delete(filename);
  }
  async remove(filename: string) {
    await this.close(filename);
    const file = this.path(filename);
    for (const target of [file, `${file}-wal`, `${file}-shm`])
      if (existsSync(target)) await unlink(target);
  }
  async query<T = Record<string, unknown>>(
    filename: string,
    sql: string,
    params: unknown[] = [],
  ) {
    const db = await this.open(filename);
    return new Promise<T[]>((resolve, reject) =>
      db.all(sql, params, (error, rows) =>
        error ? reject(error) : resolve((rows ?? []) as T[]),
      ),
    );
  }
  async run(filename: string, sql: string, params: unknown[] = []) {
    const db = await this.open(filename);
    return new Promise<void>((resolve, reject) =>
      db.run(sql, params, (error) => (error ? reject(error) : resolve())),
    );
  }
  async onApplicationShutdown() {
    for (const filename of [...this.connections.keys()])
      await this.close(filename);
  }
}
