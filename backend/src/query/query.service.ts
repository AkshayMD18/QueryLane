import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateSelectQuery, validateGroupSelectQuery } from 'src/helper';
import type { QueryResponse } from 'src/types/types.query';
import { TableService } from '../table/table.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class QueryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tableService: TableService,
    @Optional() private readonly databases?: DatabaseService,
  ) {}

  async executeAndStoreQuery(
    query: QueryResponse,
    tableId: number,
    userQuery: string,
  ) {
    try {
      const table = await this.tableService.getTableById(tableId);
      if (!table) {
        throw new BadRequestException('Table not found');
      }

      const validatedQuery = validateSelectQuery(
        query.SQLiteQuery,
        table.tableName,
      );
      const group = await this.dataSource.query<{ databasePath: string }>(
        'SELECT databasePath FROM groups WHERE id = (SELECT groupId FROM tables WHERE id = ?)',
        [tableId],
      );
      const result =
        group[0] && this.databases
          ? await this.databases.query(group[0].databasePath, validatedQuery)
          : await this.dataSource.query(validatedQuery);

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('queries')
        .values({
          tableId,
          query: query.SQLiteQuery,
          queryType: query.queryType,
          userQuery,
        })
        .execute();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async executeQuery(query: QueryResponse, groupId?: number) {
    try {
      const validatedQuery = validateSelectQuery(
        query.SQLiteQuery,
        query.tableName,
      );
      const group = groupId
        ? await this.dataSource.query<{ databasePath: string }>(
            'SELECT databasePath FROM groups WHERE id = ?',
            [groupId],
          )
        : [];
      const result =
        group[0] && this.databases
          ? await this.databases.query(group[0].databasePath, validatedQuery)
          : await this.dataSource.query(validatedQuery);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllQueriesForTable(tableId: number) {
    try {
      const result = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('queries', 'q')
        .where('q.tableId = :tableId', { tableId })
        .getRawMany();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteQuery(id: number) {
    try {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from('queries')
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw error;
    }
  }

  async executeGroupQuery(
    query: string,
    allowedTables: string[],
    groupId?: number,
  ) {
    try {
      const validatedQuery = validateGroupSelectQuery(query, allowedTables);
      const group = groupId
        ? await this.dataSource.query<{ databasePath: string }>(
            'SELECT databasePath FROM groups WHERE id = ?',
            [groupId],
          )
        : [];
      const result =
        group[0] && this.databases
          ? await this.databases.query(group[0].databasePath, validatedQuery)
          : await this.dataSource.query(validatedQuery);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async executeAndStoreGroupQuery(
    query: QueryResponse,
    groupId: number,
    userQuery: string,
  ) {
    try {
      const tablesData = await this.tableService.getAgentGroupData(groupId);
      if (!tablesData || tablesData.length === 0) {
        throw new BadRequestException('No tables found for this group');
      }
      const allowedTables = tablesData.map((t) => t.tableName);

      const result = await this.executeGroupQuery(
        query.SQLiteQuery,
        allowedTables,
        groupId,
      );

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('group_queries')
        .values({
          groupId,
          query: query.SQLiteQuery,
          queryType: query.queryType,
          userQuery,
        })
        .execute();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllQueriesForGroup(groupId: number) {
    try {
      const result = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('group_queries', 'q')
        .where('q.groupId = :groupId', { groupId })
        .getRawMany();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteGroupQuery(id: number) {
    try {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from('group_queries')
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw error;
    }
  }
}
