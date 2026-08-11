export interface QueryResponse {
  SQLiteQuery: string;
  tableName: string;
  queryType: 'table' | 'chart' | 'value';
}
