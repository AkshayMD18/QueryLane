import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { postgresDbConnector } from '../utils/utils.dbConnector';
import { copyPostgresToSqlite } from '../utils/utils.copyDb';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly databases?: DatabaseService,
  ) {}
  async createGroup(name: string) {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('groups')
      .values({ name })
      .execute();
    const id = Number(
      result.identifiers?.[0]?.id ??
        result.raw?.[0]?.id ??
        (result as { id?: number }).id,
    );
    if (!this.databases) return result;
    const databasePath = this.databases.groupFilename(name, id);
    await this.databases.create(databasePath);
    await this.dataSource.query(
      'UPDATE groups SET databasePath = ? WHERE id = ?',
      [databasePath, id],
    );
    return { ...result, databasePath };
  }

  async getAllGroups() {
    return this.dataSource
      .createQueryBuilder()
      .select('*')
      .from('groups', 'g')
      .getRawMany();
  }

  async getGroupById(id: number) {
    return this.dataSource
      .createQueryBuilder()
      .select('*')
      .from('groups', 'g')
      .where('g.id = :id', { id })
      .getRawOne();
  }

  async deleteGroup(id: number) {
    const group = (await this.getGroupById(id)) as {
      databasePath?: string;
    } | null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get all tables in the group
      const tables = await queryRunner.manager.query(
        `SELECT id, tableName FROM tables WHERE groupId = ?`,
        [id],
      );

      // 2. Remove query metadata before removing table metadata.
      for (const table of tables) {
        await queryRunner.manager.query(
          `DELETE FROM queries WHERE tableId = ?`,
          [table.id],
        );
      }

      // 3. Drop physical tables in dependency order. A table such as
      // "borrower" may be referenced by another imported table, and SQLite
      // rejects dropping the parent while foreign_keys are enabled.
      let pendingTables = [...tables];
      while (pendingTables.length > 0) {
        const remainingTables: typeof pendingTables = [];
        let droppedAny = false;

        for (const table of pendingTables) {
          const quotedTableName = `"${String(table.tableName).replace(/"/g, '""')}"`;
          try {
            await queryRunner.manager.query(
              `DROP TABLE IF EXISTS ${quotedTableName}`,
            );
            droppedAny = true;
          } catch (error) {
            // Defer only foreign-key failures; other errors should fail the
            // transaction immediately.
            if (error?.code !== 'SQLITE_CONSTRAINT') {
              throw error;
            }
            remainingTables.push(table);
          }
        }

        if (!droppedAny) {
          throw new Error(
            'Unable to drop group tables because of unresolved foreign-key dependencies',
          );
        }
        pendingTables = remainingTables;
      }

      // 4. Delete table metadata records.
      for (const table of tables) {
        await queryRunner.manager.query(`DELETE FROM tables WHERE id = ?`, [
          table.id,
        ]);
      }

      // 5. Delete group queries
      await queryRunner.manager.query(
        `DELETE FROM group_queries WHERE groupId = ?`,
        [id],
      );

      // 6. Delete the group itself
      await queryRunner.manager.query(`DELETE FROM groups WHERE id = ?`, [id]);

      await queryRunner.commitTransaction();
      if (group?.databasePath && this.databases)
        await this.databases.remove(group.databasePath);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getSnapshot(
    databaseName: string,
    schemaName: string,
    excludedTables: string[] = [],
  ) {
    console.log('[postgres-snapshot] Request options', {
      databaseName,
      schemaName,
      excludedTables,
    });
    const snapshot = await postgresDbConnector.createSnapshot(
      databaseName,
      schemaName,
      excludedTables,
    );

    const createdDate = new Date().toISOString().slice(0, 10);
    const groupName = `${databaseName}_${createdDate}`;

    // Keep the migration connection aligned with PostgresDbConnector.
    // databaseName is supplied separately below because the connection URL
    // intentionally does not hardcode the selected database.
    const connectionString = `postgresql://postgres:akshay18@localhost:5432/${encodeURIComponent(databaseName)}`;
    console.log('[postgres-snapshot] Connector returned tables', {
      count: snapshot.tables.length,
      tables: snapshot.tables.map((table) => table.tableName),
    });
    const group = (await this.createGroup(groupName)) as unknown as {
      databasePath: string;
      identifiers: Array<{ id: number }>;
      raw: Array<{ id: number }>;
    };
    if (!this.databases) throw new Error('Database service is unavailable');
    const databasePath = group.databasePath;
    try {
      const copy = await copyPostgresToSqlite({
        connectionString,
        databaseName,
        schema: schemaName,
        omitTables: excludedTables,
        sqlitePath: this.databases.path(databasePath),
        preserveExisting: false,
      });
      if (snapshot.tables.length > 0 && copy.tables.length === 0) {
        throw new Error(
          `PostgreSQL snapshot mismatch: source connector returned ${snapshot.tables.length} table(s), ` +
            `but the migration connection returned 0. Check POSTGRES_CONNECTION_STRING and database credentials.`,
        );
      }
      const groupId = group.identifiers[0]?.id ?? group.raw?.[0]?.id;
      for (const table of copy.tables) {
        await this.dataSource.query(
          `INSERT INTO tables (name, tableName, summary, groupId) VALUES (?, ?, ?, ?)`,
          [
            `${groupName}_${table.tableName}`,
            table.tableName,
            `Migrated from PostgreSQL (${table.rowCount} rows)`,
            groupId,
          ],
        );
      }

      return {
        ...snapshot,
        group: { name: groupName, insertResult: group },
      };
    } catch (error) {
      const groupId = group.identifiers[0]?.id ?? group.raw?.[0]?.id;
      await this.dataSource.query('DELETE FROM tables WHERE groupId = ?', [
        groupId,
      ]);
      await this.dataSource.query('DELETE FROM groups WHERE id = ?', [groupId]);
      await this.databases.remove(databasePath).catch(() => undefined);
      throw error;
    }
  }
}
