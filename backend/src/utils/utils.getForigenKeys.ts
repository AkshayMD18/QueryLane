import { Knex } from 'knex';
import schemaInspector from 'knex-schema-inspector';

export interface ForeignKeyInfo {
  fromTable: string;
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export const getForeignKeys = async (
  db: Knex,
  tableNames: string[],
): Promise<ForeignKeyInfo[]> => {
  const inspector = schemaInspector(db);
  const relationships = await Promise.all(
    tableNames.map((tableName) => inspector.foreignKeys(tableName)),
  );
  return relationships.flat().map((foreignKey) => ({
    fromTable: foreignKey.table,
    column: foreignKey.column,
    referencesTable: foreignKey.foreign_key_table,
    referencesColumn: foreignKey.foreign_key_column,
  }));
};
