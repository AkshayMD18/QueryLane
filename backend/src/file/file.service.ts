import { Injectable, BadRequestException } from '@nestjs/common';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Files } from './file.entity';
import { mapSqliteType } from 'src/helper/helper.tableType';

@Injectable()
export class FileService {
    constructor(
        @InjectRepository(Files)
        private fileRepository: Repository<Files>,
        private dataSource: DataSource,
    ) { }

    // get all files 
    async getAllFiles() {
        return this.fileRepository.find({
            select: ['name', 'tableName', 'summary'], // only these columns
        });
    }

    async getColumns(name: string) {
        const fileMetadata = await this.fileRepository.findOne({
            where: { name },
        });

        if (!fileMetadata) {
            throw new BadRequestException('File not found');
        }

        const tableName = fileMetadata.tableName;

        // ✅ validate table name (IMPORTANT)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new BadRequestException('Invalid table name');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        // 🔥 SQLite schema query
        const rawColumns = await queryRunner.query(
            `PRAGMA table_info(${tableName})`
        );

        await queryRunner.release();

        // 🔧 format for frontend
        const columns = rawColumns.map((col: any) => ({
            name: col.name,
            type: mapSqliteType(col.type),
        }));

        return columns;
    }

    // get table data
    async getTableData(name: string, page?: number, limit?: number) {
        const fileMetadata = await this.fileRepository.findOne({ where: { name } });
        if (!fileMetadata) {
            throw new BadRequestException('File not found');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const data = await queryRunner.query(`SELECT * FROM "${fileMetadata.tableName}" LIMIT ${limit || 20} OFFSET ${(page || 0) * (limit || 20)}`);
        await queryRunner.release();

        return data;
    }

    // parse and save file
    async parseAndSaveFile(file: Express.Multer.File, name: string): Promise<{ columns: string[], columnTypes: Record<string, string>, rowCount: number, sampleData: any[] }> {
        // 1. Check if name is unique
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
                    if (results.length === 0) {
                        return resolve({ columns: [], columnTypes: {}, rowCount: 0, sampleData: [] });
                    }

                    const columns = Object.keys(results[0]);
                    const columnTypes: Record<string, string> = {};

                    // Infer types from the first few rows
                    columns.forEach(col => {
                        const types = results.slice(0, 10).map(row => this.inferType(row[col]));
                        columnTypes[col] = this.getMostFrequent(types);
                    });

                    try {
                        // Create a safe table name from the unique name
                        const tableName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

                        // 2. Create the SQL table dynamically
                        await this.createDynamicTable(tableName, columns, columnTypes);

                        // 3. Insert and data into the table
                        await this.insertData(tableName, results);

                        // 4. Save metadata in Files entity
                        const newFile = this.fileRepository.create({
                            name,
                            tableName,
                            summary: `Contains ${results.length} rows and ${columns.length} columns.`
                        });
                        await this.fileRepository.save(newFile);

                        resolve({
                            columns,
                            columnTypes,
                            rowCount: results.length,
                            sampleData: results.slice(0, 5),
                        });
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => reject(error));
        });
    }

    private async createDynamicTable(tableName: string, columns: string[], columnTypes: Record<string, string>) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const columnDefinitions = columns.map(col => {
            const type = columnTypes[col];
            let sqliteType = 'TEXT';
            if (type === 'number') sqliteType = 'REAL';
            if (type === 'boolean') sqliteType = 'INTEGER'; // SQLite uses 0/1
            return `"${col}" ${sqliteType}`;
        }).join(', ');

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columnDefinitions})`);
        await queryRunner.release();
    }

    private async insertData(tableName: string, data: any[]) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        for (const row of data) {
            const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
            const placeholders = Object.keys(row).map(() => '?').join(', ');
            const values = Object.values(row);

            await queryRunner.query(`INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`, values);
        }

        await queryRunner.release();
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


