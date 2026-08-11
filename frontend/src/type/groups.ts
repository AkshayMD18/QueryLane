export type PostgresSnapshotRequest = {
    databaseName: string;
    schemaName: string;
    excludedTables?: string[];
};

export type Group = { id: number; name: string };
