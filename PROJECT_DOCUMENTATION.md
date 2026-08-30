# QueryLane

## Overview

QueryLane is a full-stack, AI-powered tabular data assistant. It helps people analyze CSV files and PostgreSQL snapshots without writing SQL. Source data is brought into a local SQLite workspace, where users can inspect tables, receive suggested analyses, and ask questions in plain language.

The platform uses LangChain with OpenRouter for recommendations and natural-language-to-SQL generation. Generated SQL is validated before execution so the query path stays read-only.

## What the platform supports

### Data sources

- **CSV uploads:** files are streamed, parsed, type-inferred, and stored as SQLite tables in a selected group.
- **PostgreSQL snapshots:** users enter the PostgreSQL host, port, username, password, database, and schema in the import modal. They may also provide a connection string and exclude tables. The selected data is copied into a local SQLite database for that group.

PostgreSQL is the only external database snapshot connector currently implemented. The application does not yet provide generic connectors for MySQL, SQL Server, Oracle, or other SQL databases.

### Workspace organization

- Create groups to organize related tables.
- Each group uses its own SQLite database file.
- Add CSV tables to any group.
- Browse paginated group tables and table metadata.
- Delete groups along with their table metadata, saved group queries, and local database file.

### AI-assisted analysis

- Generate up to three analysis recommendations for an individual table.
- Turn a natural-language question into a safe SQLite `SELECT` query.
- Ask questions about one table or multiple related tables in a group.
- For groups with a local SQLite snapshot, identify relevant tables from a compact list of table names and foreign-key relationships before generating a multi-table query. The full schema and sample data are passed only for selected tables.
- Classify results as a **value**, **chart**, or **table** for the frontend renderer.
- Save, review, and delete query history at both table and group level.

## Architecture

### 1. Ingestion and local storage

**CSV ingestion**

- `csv-parser` reads uploads as a stream to avoid loading the entire file into memory at once.
- The service infers number, boolean, date, and string-like values, then creates a SQLite-compatible table.
- Rows are inserted in batches to work within SQLite parameter limits.

**PostgreSQL snapshots**

- The PostgreSQL connector reads the chosen schema using connection details supplied by the frontend, discovers tables and columns, and can omit user-selected tables.
- PostgreSQL source types are normalized for snapshot metadata.
- The selected schema’s data is copied into the group’s local SQLite database; queries then run on the local copy, not against the live PostgreSQL database.

**Group databases**

- Each group has a separately named SQLite database under `backend/databases/`.
- Database connections are managed by the backend’s `DatabaseService` and closed during application shutdown.

### 2. AI and query safety

**Recommendation agent**

The agent receives table name, row count, inferred schema, and sample rows, then returns up to three practical analysis recommendations.

**Single-table query agent**

The agent receives the user’s question plus the table schema and sample rows. It returns a structured response containing the SQLite query and its result type.

**Multi-table query agent**

For group queries, the application gathers table metadata and foreign-key relationships. PostgreSQL-backed groups can first use the source schema to identify the tables relevant to the question. The resulting SQLite query is executed against the group’s local snapshot.

**Guardrails**

- Only a single read-only `SELECT` statement is allowed.
- Modifying statements and unsafe keywords are rejected.
- Table and column references are validated against available metadata.
- Queries are stored with their user question and result type for later review.

## Frontend workflow

1. Create a group.
2. Upload CSV files to it, or import a PostgreSQL snapshot.
3. Open a table to browse paginated data, inspect columns, generate recommendations, or ask a question.
4. Open the group to query across its tables, upload more CSV files, view saved group-query results, or generate schema information from the local SQLite snapshot.
5. Review saved results as tables, charts, or single values and delete history entries when no longer needed.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, shadcn/ui, Tailwind CSS, Recharts |
| Backend | NestJS, TypeScript, TypeORM, SQLite, Knex, `pg`, `csv-parser` |
| AI | LangChain, OpenRouter, Zod structured output |
| Query validation | `node-sql-parser` and application-level table/column validation |

## Safety and scope

The product is designed to make analysis more accessible, not to expose an unrestricted database console. PostgreSQL data is copied into a local SQLite snapshot before analysis. CSV uploads are also stored locally. Query execution is restricted to validated read-only SQL against those local SQLite workspaces.
