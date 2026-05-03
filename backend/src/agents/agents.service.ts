import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda } from '@langchain/core/runnables';
import { LlmserviceService } from '../llmservice/llmservice.service';
import type { tableData } from 'src/types';


@Injectable()
export class AgentsService {
    constructor(private readonly llmService: LlmserviceService) { }

    async generateAnalysisTasks(data: tableData) {
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            You are a data analysis recommendation agent.

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
            - Limit the number of queries to 3

            Data:
            - Table Name: {tableName}
            - Total Rows: {rowCount}
            - Columns and Types: {schema}
            - Sample Data: {sampleData}
        `);

        const schemaStr = Object.entries(data.columnTypes)
            .map(([col, type]) => `${col} (${type})`)
            .join(', ');

        // ✅ Create Runnable here
        const llm = new RunnableLambda({
            func: async (input: any) => {
                const prompt =
                    typeof input === 'string'
                        ? input
                        : input?.toString?.() || JSON.stringify(input);

                return await this.llmService.callOpenRouter(prompt);
            },
        });

        const chain = promptTemplate.pipe(llm);

        const raw = await chain.invoke({
            tableName: data.tableName,
            rowCount: data.rowCount,
            schema: schemaStr,
            sampleData: JSON.stringify(data.sampleData, null, 2),
        });

        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error("Invalid JSON from LLM:", raw);
            throw new Error("Failed to parse LLM response");
        }
    }

    async generateQuery(data: tableData) {
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            You are a SQLite generation agent.

            Your job is to:
            1. Understand the task given
            2. Generate a well designed, optimized SQLite query based on the task
            3. Classify the type of result the query will produce

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

            QUERY TYPE RULES:
            - "value" → if result is a single aggregated value (COUNT, SUM, AVG, MIN, MAX)
            - "chart" → if result involves GROUP BY, aggregation over categories/time
            - "table" → if result is raw or filtered rows without aggregation

            INPUT TASK:
            {query}

            OUTPUT FORMAT:
            {{
                "SQLiteQuery": "string",
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
                    - "highest grossing product name" → ORDER BY revenue DESC LIMIT 1

            Data:
            - Table Name: {tableName}
            - Total Rows: {rowCount}
            - Columns and Types: {schema}
            - Sample Data: {sampleData}
        `);

        const schemaStr = Object.entries(data.columnTypes)
            .map(([col, type]) => `${col} (${type})`)
            .join(', ');

        const llm = new RunnableLambda({
            func: async (input: any) => {
                const prompt =
                    typeof input === 'string'
                        ? input
                        : input?.toString?.() || JSON.stringify(input);

                return await this.llmService.callOpenRouter(prompt);
            },
        });

        const chain = promptTemplate.pipe(llm);

        const raw = await chain.invoke({
            query: data.query,
            tableName: data.tableName,
            rowCount: data.rowCount,
            schema: schemaStr,
            sampleData: JSON.stringify(data.sampleData),
        });

        // 🔥 STEP 1: Clean raw output (LLMs are messy)
        const cleaned = raw
            .trim()
            .replace(/```json|```/g, '') // remove markdown if any
            .trim();

        let parsed: { SQLiteQuery: string, queryType: string };

        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error("Invalid JSON from LLM:", raw);
            throw new Error("Failed to parse LLM response");
        }

        // 🔥 STEP 2: Normalize query
        let query = parsed.SQLiteQuery.trim();

        // remove trailing semicolons
        query = query.replace(/;+$/, '');

        // remove newlines / tabs (just in case)
        query = query.replace(/\s+/g, ' ');

        // 🔥 STEP 3: Validate query (CRITICAL)
        const lower = query.toLowerCase();

        if (!lower.startsWith('select')) {
            throw new Error('Only SELECT queries are allowed');
        }

        if (query.includes(';')) {
            throw new Error('Multiple statements are not allowed');
        }

        // basic forbidden keywords check
        const forbidden = ['insert', 'update', 'delete', 'drop', 'alter', 'truncate'];
        if (forbidden.some((word) => lower.includes(word))) {
            throw new Error('Forbidden SQL operation detected');
        }

        return {
            userQuery: data.query,
            SQLiteQuery: query,
            queryType: parsed.queryType
        };
    }
}
