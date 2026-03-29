import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda } from '@langchain/core/runnables';
import { LlmserviceService } from '../llmservice/llmservice.service';

@Injectable()
export class AgentPlanner {
    constructor(private readonly llmService: LlmserviceService) { }

    async generateAnalysisTasks(data: { columns: string[], columnTypes: Record<string, string>, rowCount: number, sampleData: any[] }) {
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            You are a data analysis planning agent.

            Your job is to:
            1. Understand the dataset
            2. Generate a list of SPECIFIC and ACTIONABLE analysis tasks

            STRICT RULES:
            - Output MUST be valid JSON
            - DO NOT include any text before or after JSON
            - DO NOT use markdown
            - Tasks must be concrete (e.g., "Calculate total sales per month")
            - Use ONLY the column names provided
            - Each task must include the required columns

            OUTPUT FORMAT:
            {{
                "summary": "Brief description of the dataset",
                "columns": ["column1", "column2", "column3", ...],
                "tasks": [
                    {{
                        "taskName": "string",
                        "columns": ["column1", "column2"]
                    }}
                ]
            }}

            GUIDELINES:
            - If a date column exists → include time-based tasks
            - If numeric columns exist → include aggregations (avg, sum, etc.)
            - If categorical columns exist → include grouping tasks
            - Do NOT generate vague tasks like "analyze trends"
            - Be specific and practical
            - Limit the number of tasks to 5

            Data:
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
}
