export interface QueryResponse {
    SQLiteQuery: string;
    queryType: "table" | "chart" | "value";
}