import { Database } from 'sqlite3';


interface SQLiteForeignKeyRow {
    id: number;
    seq: number;
    table: string; // The table that is referenced
    from: string;  // The column in the current table
    to: string;    // The column in the referenced table
    on_update: string;
    on_delete: string;
    match: string;
}

export interface ForeignKeyInfo {
    fromTable: string;
    column: string;
    referencesTable: string;
    referencesColumn: string;
}

export const getForeignKeys = (
    db: Database,
    tableNames: string[]
): Promise<ForeignKeyInfo[]> => {
    const promises = tableNames.map((tableName) => {
        return new Promise<ForeignKeyInfo[]>((resolve, reject) => {
            db.all(`PRAGMA foreign_key_list('${tableName}')`, (err, rows: SQLiteForeignKeyRow[]) => {
                if (err) {
                    return reject(err);
                }
                const mapped = (rows || []).map((fk) => ({
                    fromTable: tableName,
                    column: fk.from,
                    referencesTable: fk.table,
                    referencesColumn: fk.to,
                }));
                resolve(mapped);
            });
        });
    });

    return Promise.all(promises).then((results) => results.flat());
};