import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { DataSource } from 'typeorm';
import { postgresDbConnector } from '../utils/utils.dbConnector';

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

      // 2. Loop through each table and delete its associated data
      for (const table of tables) {
        // Drop the actual SQLite table
        const quotedTableName = `"${String(table.tableName).replace(/"/g, '""')}"`;
        await queryRunner.manager.query(`DROP TABLE IF EXISTS ${quotedTableName}`);

        // Delete all queries associated with this table
        await queryRunner.manager.query(
          `DELETE FROM queries WHERE tableId = ?`,
          [table.id]
        );

        // Delete the table metadata record
        await queryRunner.manager.query(
          `DELETE FROM tables WHERE id = ?`,
          [table.id]
        );
      }

      // 3. Delete group queries
      await queryRunner.manager.query(
        `DELETE FROM group_queries WHERE groupId = ?`,
        [id]
      );

      // 4. Delete the group itself
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
    const snapshot = await postgresDbConnector.createSnapshot(
      databaseName,
      schemaName,
      excludedTables,
    );

    const createdDate = new Date().toISOString().slice(0, 10);
    const groupName = `${databaseName}_${createdDate}`;
    const group = await this.createGroup(groupName);

    return {
      ...snapshot,
      group: {
        name: groupName,
        insertResult: group,
      },
    };
  }
}

