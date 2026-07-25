import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LlmserviceService } from '../llmservice/llmservice.service';
import { tableData, tablesData, analysisTasksSchema, generateQuerySchema } from 'src/types';
import { validateSelectQuery } from '../helper/helper.validateSelectQuery';
import { getForeignKeys } from '../utils/utils.getForigenKeys';
import { DataSource } from 'typeorm';
@Injectable()
export class AgentsService {
    constructor(private readonly llmService: LlmserviceService,
        private readonly dataSource: DataSource
    ) { }

    async generateAnalysisTasks(data: tableData) {
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", `You are a data analysis recommendation agent.
                Your job is to:
                1. Understand the dataset
                2. Generate a list of useful and practical analysis that can be performed on the dataset 

                STRICT RULES:
                - Output MUST be a JSON array of strings
                - The object MUST contain only one key: "recommendation"
                - The value of "recommendation" MUST be an array of strings
                - Each item must be a plain string
                - DO NOT use markdown or comments
                - Each item must contain ONLY:
                - "recommendation": a clear explanation of what the query does
                - It must be single-line strings (no newlines, tabs, or formatting)
                - Use ONLY the provided table and column names
                - DO NOT give me a raw SQL query

                OUTPUT FORMAT:
                {{
                    "recommendation": [
                        "string",
                        "string",
                        "string"
                    ]
                }}

                GUIDELINES:
                - Generate a mix of:
                - Aggregations (SUM, AVG, COUNT, etc.)
                - Grouped analysis (GROUP BY)
                - Time-based trends (if date column exists)
                - Top/bottom records (ORDER BY ... LIMIT)
                - Include both:
                - Multi-row queries (for tables/charts)
                - Single-value queries (aggregations)
                - Ensure each query is meaningful and useful for analysis
                - Avoid vague descriptions like "analyze data"
                - Limit the number of queries to 3`
            ],
            ["human", `Analyze the following dataset details:
                - Table Name: {tableName}
                - Total Rows: {rowCount}
                - Columns and Types: {schema}
                - Sample Data: {sampleData}`
            ]
        ]);

        const schemaStr = Object.entries(data.columnTypes)
            .map(([col, type]) => `${col} (${type})`)
            .join(', ');

        const analysisOutput = this.llmService.getModel().withStructuredOutput(analysisTasksSchema);

        const chain = promptTemplate.pipe(analysisOutput);

        const parsed = await chain.invoke({
            tableName: data.tableName,
            rowCount: data.rowCount,
            schema: schemaStr,
            sampleData: JSON.stringify(data.sampleData, null, 2),
        });

        return parsed;
    }

    async generateQuery(data: tableData) {
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", `You are a SQLite generation agent.
                Your job is to:
                1. Understand the task given
                2. Generate a well designed, optimized SQLite query based on the task
                3. Extract the table name used in the query
                4. Extract all columns from the dataset that are referenced anywhere in the query (including in SELECT, WHERE, JOIN, ORDER BY, GROUP BY, and HAVING clauses)
                5. Classify the type of result the query will produce

                STRICT RULES:
                - Output must be strictly valid JSON only
                - Do not include any text, explanation, or formatting outside the JSON
                - Do not use markdown or comments
                - The SQLite query must be a single-line string with no newline, tab, or escape characters
                - The SQLite query must NOT end with a semicolon (;)
                - Do not format or pretty-print the SQLite query
                - Generate only valid and executable SQLite queries
                - Use only SELECT statements (no INSERT, UPDATE, DELETE, DROP, ALTER, etc.)
                - Use only the provided table and column names (do not assume or invent any)
                - Queries must be concrete (no placeholders, variables, or pseudocode)
                - Never use SELECT *
                - The "columns" array MUST contain EVERY column referenced anywhere in the SQLiteQuery (e.g., columns used in WHERE, ORDER BY, GROUP BY, etc., must be included, not just those in the SELECT clause)

                QUERY TYPE RULES:
                - "value" → if result is a single aggregated value (COUNT, SUM, AVG, MIN, MAX)
                - "chart" → if result involves GROUP BY, aggregation over categories/time
                - "table" → if result is raw or filtered rows without aggregation

                OUTPUT FORMAT:
                {{
                    "SQLiteQuery": "string",
                    "tableName": "string",
                    "columns": ["string", "string"],
                    "queryType": "table | chart | value"
                }}

                GUIDELINES:
                - If a date column exists → include time-based grouping if relevant
                - If numeric columns exist → include aggregations if relevant
                - If categorical columns exist → include grouping if relevant
                - Always select only relevant columns
                - Be specific and practical
                - For chart always return 2 columns for x and y axis
                - If queryType is "value":
                - The result must represent a single value (one row, one column)
                - The query should return exactly one column and one row
                - Always use aggregation (e.g., COUNT, SUM, AVG, MIN, MAX) or a limiting clause (e.g., ORDER BY ... LIMIT 1) to ensure a single result
                - The returned value must be treated as a string (even if it is numeric)
                - Example cases:
                    - "total number of users" → COUNT(...)
                    - "highest grossing product name" → ORDER BY revenue DESC LIMIT 1`
            ],
            ["human", `Generate a query for:
                Task/Query: {query}
                Dataset Details:
                - Table Name: {tableName}
                - Total Rows: {rowCount}
                - Columns and Types: {schema}
                - Sample Data: {sampleData}`
            ]
        ]);

        const schemaStr = Object.entries(data.columnTypes)
            .map(([col, type]) => `${col} (${type})`)
            .join(', ');

        const queryOutput = this.llmService.getModel().withStructuredOutput(generateQuerySchema);

        const chain = promptTemplate.pipe(queryOutput);

        const parsed = await chain.invoke({
            query: data.query,
            tableName: data.tableName,
            rowCount: data.rowCount,
            schema: schemaStr,
            sampleData: JSON.stringify(data.sampleData),
        });

        console.log(parsed);

        const query = validateSelectQuery(parsed.SQLiteQuery, parsed.tableName, parsed.columns);

        return {
            userQuery: data.query,
            SQLiteQuery: query,
            queryType: parsed.queryType
        };
    }

    async generateQueryForMultipleTables(data: tablesData) {
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system",
                `You are a SQLite query generation agent.

                Your job is to:
                1. Understand the user's request
                2. Analyze all available tables and relationships
                3. Generate an optimized SQLite SELECT query
                4. Identify all tables referenced in the query
                5. Identify all columns referenced anywhere in the query
                6. Classify the query result type

                DATABASE CONTEXT:
                - Multiple tables may exist
                - Tables may be connected through foreign keys
                - Foreign key relationships are provided separately
                - Use JOINs whenever data spans multiple related tables

                STRICT RULES:
                - Output must be strictly valid JSON only
                - Do not include explanations
                - Do not include markdown
                - Do not include comments
                - SQLiteQuery must be a single-line string
                - SQLiteQuery must not contain newline characters
                - SQLiteQuery must not end with ';'
                - Use only SELECT statements
                - Never generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, PRAGMA
                - Never use SELECT *
                - Use only tables and columns that exist in the provided dataset
                - Never invent tables or columns
                - Use foreign key relationships when joining tables

                COLUMN EXTRACTION RULE:
                The columns array MUST contain EVERY column referenced anywhere in the query including:
                - SELECT
                - JOIN
                - ON
                - WHERE
                - GROUP BY
                - ORDER BY
                - HAVING

                QUERY TYPE RULES:
                - "value" = exactly one value returned
                - "chart" = grouped or aggregated result suitable for visualization
                - "table" = raw records or filtered records

                VALUE RULES:
                - Query must return exactly one row and one column
                - Use aggregation or LIMIT 1
                - Result should be directly displayable as a single value

                CHART RULES:
                - Query should return exactly 2 columns
                - First column = label/category/time
                - Second column = aggregated numeric value

                TABLE RULES:
                - Return meaningful records
                - Select only relevant columns

                OUTPUT FORMAT:
                {
                "SQLiteQuery": "string",
                "tables": ["table1", "table2"],
                "columns": ["column1", "column2"],
                "queryType": "table | chart | value"
                }`
            ],
            ["human",
                `Task:
                {query}

                Database Metadata:
                {databaseMetadata}`
            ]
        ]);
        const tables = data.tableData.map((table) => table.tableName);
        const db = (this.dataSource.driver as any).databaseConnection;
        const keys = await getForeignKeys(db, tables);

        console.log(keys)
    }
}
