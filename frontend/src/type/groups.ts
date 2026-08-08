export type PostgresSnapshotRequest = {
    databaseName: string;
    schemaName: string;
    excludedTables?: string[];
};