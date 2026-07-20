import { Injectable, BadRequestException } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from './entities/file.entity';
import { mapSqliteType } from 'src/helper';
import { FileRepository } from './file.repository';
import { getPagination } from 'src/utils/utils.pagination';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class FileService {
    constructor(
        @InjectRepository(Files)
        private fileRepository: Repository<Files>,
        private fileRepo: FileRepository,
        private groupsService: GroupsService,
    ) { }


    async getAllFiles(page?: number, limit?: number, groupId?: number) {
        const { skip, take } = getPagination(page, limit);

        const where: any = {};
        if (groupId) {
            where.groupId = groupId;
        }

        const [data, total] = await this.fileRepository.findAndCount({
            select: ['name', 'tableName', 'summary', 'groupId'],
            where,
            skip,
            take,
        });

        return {
            data,
            total,
            page: page || 1,
            limit: take,
        };
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

        const currentPage = page || 0;
        const currentLimit = limit || 20;

        const { data, total } = await this.fileRepo.getTableData(fileMetadata.tableName, currentPage, currentLimit);

        return {
            data,
            total,
            page: currentPage,
            limit: currentLimit,
        };
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
        name: string,
        groupId: number
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

        const existingGroup = await this.groupsService.getGroupById(groupId);
        if (!existingGroup) {
            throw new BadRequestException('Group not found');
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
                            groupId: groupId
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


