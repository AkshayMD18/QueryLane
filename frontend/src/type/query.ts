export type queryResponse = {
    SQLiteQuery: string;
    queryType: string;
}

export type QueryRow = Record<string, unknown>;

export type QueryResult = {
    id: string;
    userQuery?: string;
    name: string;
    queryType: 'table' | 'chart' | 'value';
    data: QueryRow[];
};
