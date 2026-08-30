# QueryLane

QueryLane is an AI-powered tabular data assistant for people who need answers from data without writing SQL. It supports CSV uploads and PostgreSQL snapshots, stores imported data in local SQLite workspaces, and turns plain-language questions into guarded read-only queries.

For architecture and feature details, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).

## Features

- Create groups for related datasets.
- Upload CSV files to a group with inferred SQLite-compatible column types.
- Import a PostgreSQL database schema into a group as a local SQLite snapshot, with optional table exclusions.
- Browse paginated table data and column metadata.
- Generate AI analysis suggestions for an individual table.
- Ask natural-language questions about one table or multiple tables in a group.
- Render results as a value, chart, or data table.
- Save, browse, and delete table-level and group-level query history.
- Run only validated, read-only SQL against local SQLite data.

> PostgreSQL is the only external database snapshot connector currently implemented. Other SQL database systems are not yet supported.

## Project structure

- `backend/` — NestJS API, SQLite group databases, PostgreSQL snapshot import, LangChain/OpenRouter integration.
- `frontend/` — React/Vite application using TanStack Query, shadcn/ui, Tailwind CSS, and Recharts.

## Prerequisites

- Node.js 18 or later
- npm
- An OpenRouter API key for AI-powered recommendations and query generation
- PostgreSQL access only if you plan to use the PostgreSQL snapshot import

```powershell
node -v
npm -v
```

## Backend setup

```powershell
cd backend
npm install
```

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Required only for PostgreSQL snapshots
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_database_name
POSTGRES_SCHEMA=public

# Optional comma-separated default exclusions
POSTGRES_EXCLUDED_TABLES=
```

Start the API:

```powershell
npm run start:dev
```

The backend runs on `http://localhost:3000`. SQLite database files are created under `backend/databases/` as groups are created or imported.

## Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:

```powershell
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Typical workflow

1. Create a group.
2. Upload CSV files or import a PostgreSQL snapshot.
3. Open a table to inspect data, generate suggested questions, or run a natural-language query.
4. Use **Query Group** when the answer needs multiple tables.
5. Review saved results in the table or group query-results tab.

## SQLite notes

SQLite is embedded through the Node.js `sqlite3` dependency—no SQLite server installation is required. You can inspect group database files with DB Browser for SQLite or a compatible VS Code extension.
