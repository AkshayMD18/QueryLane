import { BadRequestException } from "@nestjs/common";
import { Parser } from "node-sql-parser";

export function validateSelectQuery(query: string, tableName: string, columns?: string[]): string {
    if (!query || typeof query !== "string") {
        throw new BadRequestException("Query must be a valid string");
    }

    // Sanitize query by trimming, removing trailing semicolons, and normalizing whitespaces
    let sanitized = query.trim();
    sanitized = sanitized.replace(/;+$/, '');
    sanitized = sanitized.replace(/\s+/g, ' ');

    const parser = new Parser();
    try {
        // Parse AST to verify query is a single SELECT and extract CTE/Alias names
        const ast = parser.astify(sanitized, { database: 'sqlite' });
        const statements = Array.isArray(ast) ? ast : [ast];

        if (statements.length > 1) {
            throw new BadRequestException("Multiple statements are not allowed");
        }

        const stmt = statements[0];

        // Definitively check if the root statement type is 'select'
        if (stmt.type !== 'select') {
            throw new BadRequestException("Only SELECT queries are allowed");
        }

        // Extract local CTE tables, CTE columns, and aliases from AST root
        const cteTables = new Set<string>();
        const cteColumns = new Set<string>();
        const aliases = new Set<string>();

        if (stmt.with) {
            const ctes = Array.isArray(stmt.with) ? stmt.with : [stmt.with];
            for (const cte of ctes) {
                if (cte.name && cte.name.value) {
                    cteTables.add(cte.name.value.toLowerCase());
                }
                if (cte.columns && Array.isArray(cte.columns)) {
                    for (const col of cte.columns) {
                        if (col.value) {
                            cteColumns.add(col.value.toLowerCase());
                        }
                    }
                }
            }
        }

        if (stmt.columns && Array.isArray(stmt.columns)) {
            for (const col of stmt.columns) {
                if (col.as && typeof col.as === 'string') {
                    aliases.add(col.as.toLowerCase());
                }
            }
        }

        // Use built-in parser helpers for tables and columns
        const tableList = parser.tableList(sanitized, { database: 'sqlite' });
        const columnList = parser.columnList(sanitized, { database: 'sqlite' });

        // Table Validation
        if (tableName) {
            const targetTable = tableName.toLowerCase();
            const referencedTables = tableList.map(t => t.split('::').pop()!.toLowerCase());
            const unauthorizedTables = referencedTables.filter(
                t => t !== targetTable && !cteTables.has(t)
            );
            if (unauthorizedTables.length > 0) {
                throw new BadRequestException(`Unauthorized table references: ${unauthorizedTables.join(', ')}`);
            }
        }

        // Column Validation
        if (columns && columns.length > 0) {
            const allowedColsSet = new Set(columns.map(c => c.toLowerCase()));
            const unauthorizedColumns = new Set<string>();

            for (const colStr of columnList) {
                const parts = colStr.split('::');
                const colTable = parts[1] ? parts[1].toLowerCase() : 'null';
                const colName = parts[2] ? parts[2].toLowerCase() : 'null';

                // Ignore wildcards, columns belonging to CTEs, or recognized aliases
                if (colName === '*' || colName === 'null') continue;
                if (colTable !== 'null' && cteTables.has(colTable)) continue;
                if (cteColumns.has(colName) || aliases.has(colName)) continue;

                // Otherwise it must belong to our main table
                if (!allowedColsSet.has(colName)) {
                    unauthorizedColumns.add(colName);
                }
            }

            if (unauthorizedColumns.size > 0) {
                throw new BadRequestException(`Unauthorized or non-existent columns referenced: ${Array.from(unauthorizedColumns).join(', ')}`);
            }
        }

    } catch (err: any) {
        if (err instanceof BadRequestException) {
            throw err;
        }
        throw new BadRequestException(`SQL Parsing Error: ${err.message}`);
    }

    return sanitized;
}

export function validateGroupSelectQuery(query: string, allowedTables: string[]): string {
    if (!query || typeof query !== "string") {
        throw new BadRequestException("Query must be a valid string");
    }

    // Sanitize query by trimming, removing trailing semicolons, and normalizing whitespaces
    let sanitized = query.trim();
    sanitized = sanitized.replace(/;+$/, '');
    sanitized = sanitized.replace(/\s+/g, ' ');

    const parser = new Parser();
    try {
        // Parse AST to verify query is a single SELECT and extract CTE/Alias names
        const ast = parser.astify(sanitized, { database: 'sqlite' });
        const statements = Array.isArray(ast) ? ast : [ast];

        if (statements.length > 1) {
            throw new BadRequestException("Multiple statements are not allowed");
        }

        const stmt = statements[0];

        // Definitively check if the root statement type is 'select'
        if (stmt.type !== 'select') {
            throw new BadRequestException("Only SELECT queries are allowed");
        }

        // Extract local CTE tables from AST root
        const cteTables = new Set<string>();

        if (stmt.with) {
            const ctes = Array.isArray(stmt.with) ? stmt.with : [stmt.with];
            for (const cte of ctes) {
                if (cte.name && cte.name.value) {
                    cteTables.add(cte.name.value.toLowerCase());
                }
            }
        }

        // Use built-in parser helpers for tables
        const tableList = parser.tableList(sanitized, { database: 'sqlite' });

        // Table Validation
        if (allowedTables && allowedTables.length > 0) {
            const allowedSet = new Set(allowedTables.map(t => t.toLowerCase()));
            const referencedTables = tableList.map(t => t.split('::').pop()!.toLowerCase());
            const unauthorizedTables = referencedTables.filter(
                t => !allowedSet.has(t) && !cteTables.has(t)
            );
            if (unauthorizedTables.length > 0) {
                throw new BadRequestException(`Unauthorized table references: ${unauthorizedTables.join(', ')}`);
            }
        }

    } catch (err: any) {
        if (err instanceof BadRequestException) {
            throw err;
        }
        throw new BadRequestException(`SQL Parsing Error: ${err.message}`);
    }

    return sanitized;
}