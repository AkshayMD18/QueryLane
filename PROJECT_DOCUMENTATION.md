# Intelligent CSV Analysis & Query Platform

## Project Title
**Intelligent CSV Analysis & Query Platform (AI-Powered Tabular Data Assistant)**

---

## Introduction
The **Intelligent CSV Analysis & Query Platform** is a full-stack web application designed to democratize and accelerate data analysis. Rather than requiring users to write complex SQL statements or possess programming skills in Python/Pandas, this platform allows users to upload raw CSV files, automatically parses and structures them into a relational SQLite database, and offers an intuitive natural language interface. 

Powered by Large Language Models (LLMs) integrated via LangChain and OpenRouter, the application automatically analyzes data schemas to recommend relevant analytical tasks and translates natural language questions directly into optimized, secure SQL queries.

---

## Objectives
1. **Dynamic Data Ingestion**: Provide an effortless mechanism to upload CSV files, automatically infer correct data types (numbers, dates, booleans, strings), and generate matching database tables dynamically.
2. **AI-Driven Automated Insights**: Leverage LLMs to understand table structures and sample data, automatically generating relevant query recommendations and analytical tasks.
3. **Natural Language to SQL Translation**: Permit users to query their uploaded datasets in plain English, transforming these inputs into executable, valid SQLite commands.
4. **Execution Safety and Validation**: Ensure robust sanitization, syntax validation, and permission checks so that only safe read-only (`SELECT`) operations are executed.
5. **Interactive Visualization**: Display query outcomes using tabular views or visual representations categorized by data type (charts, single metrics, or raw data grids).

---

## Problem Statement
Traditional data analysis is bottlenecked by the technical skills required to interact with databases and analytical tools. Business users, analysts, and project managers often need rapid answers from CSV files but are held back by:
* The need to write complex SQL or write custom Python script boilerplate for basic tasks like grouping, filtering, or aggregating.
* The lack of guidance on what questions a dataset can answer (users often do not know what patterns or insights are hidden in their data).
* Security concerns with open-ended code interpreters or unchecked SQL injection risks when using AI-generated database commands.

There is a distinct need for a localized, lightweight, and secure tool that bridges the gap between natural language reasoning and structural SQL query execution over uploaded files.

---

## Methodology/Approach
The platform uses a modular decoupled architecture:

### 1. Data Processing & Storage (Backend ingestion)
* **Stream Processing**: When a CSV is uploaded, a stream parser (`csv-parser`) reads the data on the fly to avoid high memory overhead.
* **Schema Inference**: The backend samples the first several rows of data to detect types (`number`, `boolean`, `date`, `string`) and maps them to SQLite-compatible storage classes (`REAL`, `INTEGER`, `TEXT`).
* **Dynamic Table Creation**: Generates tables matching the file name and executes dynamic DDL statements to configure the SQLite schema.
* **Batch Ingestion**: Inserts data in optimized chunks of 500 rows to bypass SQLite parameter limits.

### 2. Cognitive Layer (AI Agents)
* **Recommendation Agent**: Receives the dynamic schema structure, row count, and sample data. Constructs a LangChain prompt template requesting up to three meaningful business recommendations.
* **Query Translation Agent**: Translates user natural language questions into SQLite queries. It evaluates the structure and flags the output format as either `value` (single aggregations), `chart` (group-by distributions), or `table` (raw subsets).
* **Security & Verification**: Intercepts LLM outputs to strip markdown, formatting syntax, and execute validation checks (e.g., ensuring queries start with `SELECT`, block dangerous keywords like `DROP`, `UPDATE`, `DELETE`, and forbid multiple semicolon statements).

### 3. Client Interaction (Frontend dashboard)
* **Data Hub**: Displays lists of uploaded tables.
* **Interactive Query Console**: Houses a query modal where users can run custom natural language questions or trigger automatic analysis tasks.
* **Tabular & Analytical View**: Renders raw data in a paginated grid alongside a tab dedicated to query history and structured AI results.

---

## Tools or Technologies Used
* **Frontend**:
  * **React** (v18) with **TypeScript** for interactive state management.
  * **Vite** for fast, optimized building and hot module replacement.
  * **shadcn/ui** & **Tailwind CSS** for clean, accessible, modern UI elements.
  * **TanStack Query** (React Query) for caching and asynchronous state synchronization.
* **Backend**:
  * **NestJS** (TypeScript) for a structured, scalable module-based server application.
  * **TypeORM** for robust database interaction, transaction safety, and entity configuration.
  * **SQLite** (via TypeORM) as a lightweight, file-based relational database.
  * **LangChain** (`@langchain/core`) to manage prompt flows and LLM pipelines.
  * **OpenRouter API** to dynamically integrate model inference.

---

## Expected Outcome or Results
* **Instant Ingestion**: Users can upload any standard CSV file and view its contents in a neat, paginated data grid within seconds.
* **Self-Generating Reports**: Clicking "Generate Tasks" immediately presents the user with recommendations tailored specifically to their columns (e.g., trend analysis for date columns, numeric summaries, or grouping categories).
* **Seamless Querying**: Typing `"Find the average value grouped by category"` generates and runs the correct SQL query in real-time, retrieving accurate calculations directly from the database.
* **Safety First**: Any malicious or malformed database query attempt (e.g., attempting SQL injection or modification) is safely caught, logged, and blocked before hitting the database.

---

## Conclusion
The **Intelligent CSV Analysis & Query Platform** successfully merges classical relational database management with state-of-the-art Large Language Models. By streamlining the ingestion, schema generation, query formulation, and visualization steps into an integrated single interface, it empowers users of any technical skill level to draw direct, data-driven conclusions from their files safely and immediately.
