import { Injectable, BadRequestException } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableEntity } from './entities/table.entity';
import { mapSqliteType } from 'src/helper';
import { TableRepository } from './table.repository';
import { getPagination } from 'src/utils/utils.pagination';
import { GroupsService } from '../groups/groups.service';
import { tableData } from 'src/types/types.agents';

@Injectable()
export class TableService {
    constructor(
        @InjectRepository(TableEntity)
        private tableRepository: Repository<TableEntity>,
        private tableRepo: TableRepository,
        private groupsService: GroupsService,
    ) { }

    async getAllTables(page?: number, limit?: number, groupId?: number) {
        const { skip, take } = getPagination(page, limit);

        const where: any = {};
        if (groupId) {
            where.groupId = groupId;
        }

        const [data, total] = await this.tableRepository.findAndCount({
            select: ['id', 'name', 'tableName', 'summary', 'groupId'],
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

    async getTableById(id: number) {
        return this.tableRepository.findOne({ where: { id } });
    }

    async getColumns(tableName: string) {
        const tableMetadata = await this.tableRepository.findOne({ where: { tableName } });
        if (!tableMetadata) {
            throw new BadRequestException('Table not found');
        }

        const { rawColumns } = await this.tableRepo.fetchTableDetails(tableMetadata.tableName);

        return rawColumns.map((col: any) => ({
            name: col.name,
            type: mapSqliteType(col.type),
        }));
    }

    async getTableData(tableName: string, page?: number, limit?: number) {
        const tableMetadata = await this.tableRepository.findOne({ where: { tableName } });
        if (!tableMetadata) {
            throw new BadRequestException('Table not found');
        }

        const currentPage = page || 0;
        const currentLimit = limit || 20;

        const { data, total } = await this.tableRepo.getTableData(tableMetadata.tableName, currentPage, currentLimit);

        return {
            data,
            total,
            page: currentPage,
            limit: currentLimit,
        };
    }

    async getAgentTableData(tableName: string) {
        const tableMetadata = await this.tableRepository.findOne({ where: { tableName } });
        if (!tableMetadata) {
            throw new BadRequestException('Table not found');
        }

        const { rawColumns, sampleData, rowCount } = await this.tableRepo.fetchTableDetails(tableMetadata.tableName);

        const columns = rawColumns.map((col: any) => col.name);
        const columnTypes: Record<string, string> = {};
        rawColumns.forEach((col: any) => {
            columnTypes[col.name] = mapSqliteType(col.type);
        });

        return {
            tableName: tableMetadata.tableName,
            columns,
            columnTypes,
            sampleData,
            rowCount,
        };
    }

    async getAgentGroupData(groupId: number) {
        const tables = await this.tableRepository.find({ where: { groupId } });
        if (!tables || tables.length === 0) {
            throw new BadRequestException('No tables found for this group');
        }

        const tablesData: Array<tableData> = [];
        for (const table of tables) {
            const { rawColumns, sampleData, rowCount } = await this.tableRepo.fetchTableDetails(table.tableName);

            const columns = rawColumns.map((col: any) => col.name);
            const columnTypes: Record<string, string> = {};
            rawColumns.forEach((col: any) => {
                columnTypes[col.name] = mapSqliteType(col.type);
            });

            tablesData.push({
                tableName: table.tableName,
                columns,
                columnTypes,
                sampleData,
                rowCount,
            });
        }

        return tablesData;
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
        const existingTable = await this.tableRepository.findOne({ where: { name } });
        if (existingTable) {
            throw new BadRequestException('Table with this name already exists');
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

                    // Infer types
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

                        const newTable = this.tableRepository.create({
                            name,
                            tableName,
                            summary: `Contains ${results.length} rows and ${columns.length} columns.`,
                            groupId: groupId
                        });

                        await this.tableRepository.save(newTable);

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

        await this.tableRepo.createDynamicTable(tableName, columnDefs);
    }

    private async insertDataBatch(tableName: string, data: any[]) {
        if (!data.length) return;

        const columns = Object.keys(data[0]);
        const colNames = columns.map((c) => `"${c}"`).join(', ');
        const placeholders = `(${columns.map(() => '?').join(', ')})`;

        const batchSize = 500;

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            const values: any[] = [];
            const rowsSql = batch
                .map((row) => {
                    columns.forEach((col) => values.push(row[col]));
                    return placeholders;
                })
                .join(', ');

            await this.tableRepo.insertDataBatch(tableName, colNames, rowsSql, values);
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
