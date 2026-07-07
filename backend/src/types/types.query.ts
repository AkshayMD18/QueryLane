export interface QueryResponse {
    SQLiteQuery: string;
    tableName: string;
    columns: string[]
    queryType: "table" | "chart" | "value";
}