import { Test, TestingModule } from '@nestjs/testing';
import { QueryService } from './query.service';
import { DataSource } from 'typeorm';
import { TableService } from '../table/table.service';
import { BadRequestException } from '@nestjs/common';

describe('QueryService', () => {
  let service: QueryService;
  let tableService: TableService;

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    getRawMany: jest.fn(),
    delete: jest.fn().mockReturnThis(),
  };

  const mockDataSource = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    query: jest.fn(),
  };

  const mockTableService = {
    getTableById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: TableService,
          useValue: mockTableService,
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    tableService = module.get<TableService>(TableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeAndStoreQuery', () => {
    it('should successfully execute and store a valid query', async () => {
      const mockTable = { id: 1, tableName: 'users' };
      const mockQueryResponse = {
        SQLiteQuery: 'SELECT * FROM users',
        tableName: 'users',
        queryType: 'table' as const,
      };

      mockTableService.getTableById.mockResolvedValue(mockTable);
      mockDataSource.query.mockResolvedValue([{ id: 1 }]);
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      const result = await service.executeAndStoreQuery(
        mockQueryResponse,
        1,
        'get all users',
      );
      expect(result).toEqual([{ id: 1 }]);
      expect(tableService.getTableById).toHaveBeenCalledWith(1);
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should throw BadRequestException if table is not found', async () => {
      mockTableService.getTableById.mockResolvedValue(null);

      const mockQueryResponse = {
        SQLiteQuery: 'SELECT * FROM users',
        tableName: 'users',
        queryType: 'table' as const,
      };

      await expect(
        service.executeAndStoreQuery(mockQueryResponse, 1, 'get all users'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllQueriesForTable', () => {
    it('should query and return queries for a given tableId', async () => {
      const mockQueriesList = [{ id: 1, query: 'SELECT *' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockQueriesList);

      const res = await service.getAllQueriesForTable(1);
      expect(res).toEqual(mockQueriesList);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'q.tableId = :tableId',
        { tableId: 1 },
      );
    });
  });

  describe('deleteQuery', () => {
    it('should delete query history by id', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      await service.deleteQuery(1);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: 1,
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
