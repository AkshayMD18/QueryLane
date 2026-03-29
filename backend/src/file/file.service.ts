import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class FileService {
    async parseFile(file: Express.Multer.File): Promise<{ columns: string[], columnTypes: Record<string, string>, rowCount: number, sampleData: any[] }> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(file.buffer);
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    if (results.length === 0) {
                        return resolve({ columns: [], columnTypes: {}, rowCount: 0, sampleData: [] });
                    }

                    const columns = Object.keys(results[0]);
                    const columnTypes: Record<string, string> = {};

                    // Infer types from the first few rows
                    columns.forEach(col => {
                        const types = results.slice(0, 10).map(row => this.inferType(row[col]));
                        // Get the most frequent type or fallback to string
                        columnTypes[col] = this.getMostFrequent(types);
                    });

                    resolve({
                        columns,
                        columnTypes,
                        rowCount: results.length,
                        sampleData: results.slice(0, 5), // Keep a small sample for the LLM
                    });
                })
                .on('error', (error) => reject(error));
        });
    }

    private inferType(value: string): string {
        if (!value || value.trim() === '') return 'null';
        if (!isNaN(Number(value))) return 'number';
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
        if (!isNaN(Date.parse(value))) return 'date';
        return 'string';
    }

    private getMostFrequent(arr: string[]): string {
        const counts: Record<string, number> = {};
        arr.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'string');
    }
}

