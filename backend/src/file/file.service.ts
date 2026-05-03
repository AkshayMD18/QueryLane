import { Injectable, BadRequestException } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from './file.entity';
import { mapSqliteType } from 'src/helper';
import { FileRepository } from './file.repository';

@Injectable()
export class FileService {
    constructor(
        @InjectRepository(Files)
        private fileRepository: Repository<Files>,
        private fileRepo: FileRepository,
    ) { }


    async getAllFiles() {
        return this.fileRepository.find({
            select: ['name', 'tableName', 'summary'], // only these columns
        });
    }

    async getColumns(tableName: string) {
        const fileMetadata = await this.fileRepository.findOne({ where: { tableName } });
        if (!fileMetadata) {
            throw new BadRequestException('File not found');
        }

        const { rawColumns } = await this.fileRepo.fetchTableDetails(fileMetadata.tableName);

        return rawColumns.map((col: any) => ({
            name: col.name,
            type: mapSqliteType(col.type),
        }));
    }

    async getTableData(tableName: string, page?: number, limit?: number) {
        const fileMetadata = await this.fileRepository.findOne({ where: { tableName } });
        if (!fileMetadata) {
            throw new BadRequestException('File not found');
        }

        return this.fileRepo.getTableData(fileMetadata.tableName, page || 0, limit || 20);
    }

    async getAgentTableData(tableName: string) {
        const fileMetadata = await this.fileRepository.findOne({ where: { tableName } });
        if (!fileMetadata) {
            throw new BadRequestException('File not found');
        }

        const { rawColumns, sampleData, rowCount } = await this.fileRepo.fetchTableDetails(fileMetadata.tableName);

        const columns = rawColumns.map((col: any) => col.name);
        const columnTypes: Record<string, string> = {};
        rawColumns.forEach((col: any) => {
            columnTypes[col.name] = mapSqliteType(col.type);
        });

        return {
            tableName: fileMetadata.tableName,
            columns,
            columnTypes,
            sampleData,
            rowCount,
        };
    }


    async parseAndSaveFile(
        file: Express.Multer.File,
        name: string
    ): Promise<{
        columns: string[];
        columnTypes: Record<string, string>;
        rowCount: number;
        sampleData: any[];
    }> {
        const existingFile = await this.fileRepository.findOne({ where: { name } });
        if (existingFile) {
            throw new BadRequestException('File with this name already exists');
        }

        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(file.buffer);

            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    if (!results.length) {
                        return resolve({
                            columns: [],
                            columnTypes: {},
                            rowCount: 0,
                            sampleData: [],
                        });
                    }

                    const columns = Object.keys(results[0]);
                    const columnTypes: Record<string, string> = {};

                    // 🔍 Infer types
                    columns.forEach((col) => {
                        const types = results
                            .slice(0, 10)
                            .map((row) => this.inferType(row[col]));
                        columnTypes[col] = this.getMostFrequent(types);
                    });

                    try {
                        const tableName = name
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .toLowerCase();

                        await this.createDynamicTable(tableName, columns, columnTypes);

                        await this.insertDataBatch(tableName, results);

                        const newFile = this.fileRepository.create({
                            name,
                            tableName,
                            summary: `Contains ${results.length} rows and ${columns.length} columns.`,
                        });

                        await this.fileRepository.save(newFile);

                        resolve({
                            columns,
                            columnTypes,
                            rowCount: results.length,
                            sampleData: results.slice(0, 5),
                        });
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', reject);
        });
    }

    private async createDynamicTable(
        tableName: string,
        columns: string[],
        columnTypes: Record<string, string>
    ) {
        const columnDefs = columns
            .map((col) => {
                const type = columnTypes[col];
                let sqliteType = 'TEXT';

                if (type === 'number') sqliteType = 'REAL';
                if (type === 'boolean') sqliteType = 'INTEGER';

                return `"${col}" ${sqliteType}`;
            })
            .join(', ');

        await this.fileRepo.createDynamicTable(tableName, columnDefs);
    }

    private async insertDataBatch(tableName: string, data: any[]) {
        if (!data.length) return;

        const columns = Object.keys(data[0]);
        const colNames = columns.map((c) => `"${c}"`).join(', ');
        const placeholders = `(${columns.map(() => '?').join(', ')})`;

        const batchSize = 500; // avoid SQLite limits

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            const values: any[] = [];
            const rowsSql = batch
                .map((row) => {
                    columns.forEach((col) => values.push(row[col]));
                    return placeholders;
                })
                .join(', ');

            await this.fileRepo.insertDataBatch(tableName, colNames, rowsSql, values);
        }
    }

    private inferType(value: string): string {
        if (!value || value.trim() === '') return 'null';
        if (!isNaN(Number(value))) return 'number';
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
            return 'boolean';
        if (!isNaN(Date.parse(value))) return 'date';
        return 'string';
    }

    private getMostFrequent(arr: string[]): string {
        const counts: Record<string, number> = {};

        arr.forEach((val) => {
            counts[val] = (counts[val] || 0) + 1;
        });

        return Object.keys(counts).reduce((a, b) =>
            counts[a] > counts[b] ? a : b
        );
    }
}


