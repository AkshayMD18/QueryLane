import knex from 'knex';
import schemaInspector from 'knex-schema-inspector';
import { getPostgresConfig } from './utils.dbConnector';

export const getDbSchema = async (databaseName: string, schemaName: string) => {
  const config = getPostgresConfig();
  if (!config.password || config.password === 'your_postgres_password') {
    throw new Error(
      'POSTGRES_PASSWORD is missing or still set to the placeholder value. Set it in backend/.env and restart the server.',
    );
  }
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
