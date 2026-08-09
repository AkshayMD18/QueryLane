import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { DataSource } from 'typeorm';
import { postgresDbConnector } from '../utils/utils.dbConnector';
import { copyPostgresToSqlite } from '../utils/utils.copyDb';
import { join } from 'node:path';

@Injectable()
export class GroupsService {
  constructor(private readonly dataSource: DataSource) { }
  async createGroup(name: string) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .insert()
        .into("groups")
        .values({ name })
        .execute();
    } catch (error) {
      throw error;
    }
  }

  async getAllGroups() {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select("*")
        .from("groups", "g")
        .getRawMany();
    }
    catch (error) {
      throw error;
    }
  }

  async getGroupById(id: number) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select("*")
        .from("groups", "g")
        .where("g.id = :id", { id })
        .getRawOne();
    }
    catch (error) {
      throw error;
    }
  }

  async deleteGroup(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get all tables in the group
      const tables = await queryRunner.manager.query(
        `SELECT id, tableName FROM tables WHERE groupId = ?`,
        [id]
      );

      // 2. Remove query metadata before removing table metadata.
      for (const table of tables) {
        await queryRunner.manager.query(
          `DELETE FROM queries WHERE tableId = ?`,
          [table.id]
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
            await queryRunner.manager.query(`DROP TABLE IF EXISTS ${quotedTableName}`);
            droppedAny = true;
          } catch (error) {
            // Defer only foreign-key failures; other errors should fail the
            // transaction immediately.
            if ((error as any)?.code !== 'SQLITE_CONSTRAINT') {
              throw error;
            }
            remainingTables.push(table);
          }
        }

        if (!droppedAny) {
          throw new Error('Unable to drop group tables because of unresolved foreign-key dependencies');
        }
        pendingTables = remainingTables;
      }

      // 4. Delete table metadata records.
      for (const table of tables) {
        await queryRunner.manager.query(
          `DELETE FROM tables WHERE id = ?`,
          [table.id]
        );
      }

      // 5. Delete group queries
      await queryRunner.manager.query(
        `DELETE FROM group_queries WHERE groupId = ?`,
        [id]
      );

      // 6. Delete the group itself
      await queryRunner.manager.query(
        `DELETE FROM groups WHERE id = ?`,
        [id]
      );

      await queryRunner.commitTransaction();
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
    console.log('[postgres-snapshot] Request options', { databaseName, schemaName, excludedTables });
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
    console.log('[postgres-snapshot] Connector returned tables', { count: snapshot.tables.length, tables: snapshot.tables.map(table => table.tableName) });
    const copy = await copyPostgresToSqlite({
      connectionString,
      databaseName,
      schema: schemaName,
      omitTables: excludedTables,
      sqlitePath: join(process.cwd(), 'db.sqlite'),
      preserveExisting: true,
    });
    if (snapshot.tables.length > 0 && copy.tables.length === 0) {
      throw new Error(
        `PostgreSQL snapshot mismatch: source connector returned ${snapshot.tables.length} table(s), ` +
        `but the migration connection returned 0. Check POSTGRES_CONNECTION_STRING and database credentials.`,
      );
    }
    // Do not create a visible group until the physical migration and validation succeed.
    const group = await this.createGroup(groupName);
    const groupId = group.identifiers[0]?.id ?? group.raw?.[0]?.id;
    for (const table of copy.tables) {
      await this.dataSource.query(
        `INSERT INTO tables (name, tableName, summary, groupId) VALUES (?, ?, ?, ?)`,
        [`${groupName}_${table.tableName}`, table.tableName,
          `Migrated from PostgreSQL (${table.rowCount} rows)`, groupId],
      );
    }

    return {
      ...snapshot,
      group: {
        name: groupName,
        insertResult: group,
      },
    };
  }
}

