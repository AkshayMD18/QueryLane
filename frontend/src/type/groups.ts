export type PostgresSnapshotRequest = {
    host: string;
    port: number;
    user: string;
    password: string;
    databaseName: string;
    schemaName: string;
    connectionString?: string;
    excludedTables?: string[];
};

export type Group = { id: number; name: string };
