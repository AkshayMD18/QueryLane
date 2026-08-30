import knex from 'knex';
import schemaInspector from 'knex-schema-inspector';
import type { PostgresConnection } from './utils.dbConnector';

export const getDbSchema = async (config: PostgresConnection, schemaName: string) => {
  const databaseName = config.database;
  const db = knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: databaseName,
    },
  });

  try {
    const inspector = schemaInspector(db);
    inspector.withSchema?.(schemaName);
    const foreignKeys = await inspector.foreignKeys();

    return {
      databaseName,
      schemaName,
      relationships: foreignKeys.map((foreignKey) => ({
        table: foreignKey.table,
        column: foreignKey.column,
        referencedTable: foreignKey.foreign_key_table,
        referencedColumn: foreignKey.foreign_key_column,
      })),
    };
  } finally {
    await db.destroy();
  }
};
