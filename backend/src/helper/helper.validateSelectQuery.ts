import { BadRequestException } from "@nestjs/common";
import { Parser } from "node-sql-parser";

export function sanitizeQuery(query: string): string {
    let sanitized = query.trim();
    sanitized = sanitized.replace(/;+$/, '');
    sanitized = sanitized.replace(/\s+/g, ' ');
    return sanitized;
}

export function validateSelectQuery(query: string): string {
    if (!query || typeof query !== "string") {
        throw new BadRequestException("Query must be a valid string");
    }

    const parser = new Parser();
    try {
        // Parse the SQL query into an AST targeting SQLite
        const ast = parser.astify(query, { database: 'sqlite' });

        // If multiple statements are provided, check all of them
        const statements = Array.isArray(ast) ? ast : [ast];

        if (statements.length > 1) {
            throw new BadRequestException("Multiple statements are not allowed");
        }

        const stmt = statements[0];

        // Definitively check if the root statement type is 'select'
        // This covers SELECT, SELECT ... UNION, and SELECT inside WITH (CTEs)
        if (stmt.type !== 'select') {
            throw new BadRequestException("Only SELECT queries are allowed");
        }

    } catch (err: any) {
        if (err instanceof BadRequestException) {
            throw err;
        }
        throw new BadRequestException(`SQL Parsing Error: ${err.message}`);
    }

    return query;
}