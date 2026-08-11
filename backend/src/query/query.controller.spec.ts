import { Test, TestingModule } from '@nestjs/testing';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { TableService } from '../table/table.service';
import { BadRequestException } from '@nestjs/common';

describe('QueryController', () => {
  let controller: QueryController;
  let queryService: QueryService;
  let tableService: TableService;

  const mockQueryService = {
    executeAndStoreQuery: jest.fn(),
    getAllQueriesForTable: jest.fn(),
    executeQuery: jest.fn(),
    deleteQuery: jest.fn(),
  };

  const mockTableService = {
    getTableById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [
        {
          provide: QueryService,
          useValue: mockQueryService,
        },
        {
          provide: TableService,
          useValue: mockTableService,
        },
      ],
    }).compile();

    controller = module.get<QueryController>(QueryController);
    queryService = module.get<QueryService>(QueryService);
    tableService = module.get<TableService>(TableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('executeQuery', () => {
    it('should store and execute query and return result', async () => {
      const mockResult = [{ id: 1 }];
      mockQueryService.executeAndStoreQuery.mockResolvedValue(mockResult);

      const response = await controller.executeQuery({
        query: {
          SQLiteQuery: 'SELECT *',
          tableName: 'users',
          queryType: 'table',
        },
        tableId: 1,
        userQuery: 'get all users',
      });

      expect(queryService.executeAndStoreQuery).toHaveBeenCalled();
      expect(response).toEqual(mockResult);
    });
  });

  describe('getAllQueriesForTable', () => {
    it('should throw BadRequestException if table is not found', async () => {
      mockTableService.getTableById.mockResolvedValue(null);
      await expect(
        controller.getAllQueriesForTable({ tableId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should execute saved queries and return list', async () => {
      const mockTable = { id: 1, tableName: 'users' };
      const mockQueriesList = [
        { id: 5, query: 'SELECT *', userQuery: 'all', queryType: 'table' },
      ];

      mockTableService.getTableById.mockResolvedValue(mockTable);
      mockQueryService.getAllQueriesForTable.mockResolvedValue(mockQueriesList);
      mockQueryService.executeQuery.mockResolvedValue([{ data: 1 }]);

      const response = await controller.getAllQueriesForTable({ tableId: 1 });
      expect(response).toEqual([
        {
          id: 5,
          userQuery: 'all',
          query: 'SELECT *',
          queryType: 'table',
          data: [{ data: 1 }],
        },
      ]);
    });
  });

  describe('deleteQuery', () => {
    it('should call deleteQuery and return result', async () => {
      mockQueryService.deleteQuery.mockResolvedValue(undefined);
      await controller.deleteQuery({ id: 5 });
      expect(queryService.deleteQuery).toHaveBeenCalledWith(5);
    });
  });
});
