import { z } from 'zod';

export type tableData = {
    tableName: string
    rowCount: number,
    sampleData: any[]
    columns: string[]
    columnTypes: Record<string, string>
    query?: string,
}

export const analysisTasksSchema = z.object({
    recommendation: z.array(z.string()),
});

export type AnalysisTasks = z.infer<typeof analysisTasksSchema>;

export const generateQuerySchema = z.object({
    SQLiteQuery: z.string(),
    tableName: z.string(),
    columns: z.array(z.string()),
    queryType: z.enum(['table', 'chart', 'value']),
});

export type GenerateQuery = z.infer<typeof generateQuerySchema>;