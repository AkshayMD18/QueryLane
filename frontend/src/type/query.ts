export type queryResponse = {
    SQLiteQuery: string;
    queryType: string;
}

export type QueryRow = Record<string, any>;

export type QueryResult = {
    id: string;
    name: string;
    queryType: 'table' | 'chart' | 'value';
    data: QueryRow[];
};