import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from './table.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TableEntity } from './entities/table.entity';
import { TableRepository } from './table.repository';
import { GroupsService } from '../groups/groups.service';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('TableService', () => {
  let service: TableService;
  let repo: Repository<TableEntity>;
  let tableRepo: TableRepository;
  let groupsService: GroupsService;

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTableRepository = {
    fetchTableDetails: jest.fn(),
    getTableData: jest.fn(),
    createDynamicTable: jest.fn(),
    insertDataBatch: jest.fn(),
  };

  const mockGroupsService = {
    getGroupById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableService,
        {
          provide: getRepositoryToken(TableEntity),
          useValue: mockRepository,
        },
        {
          provide: TableRepository,
          useValue: mockTableRepository,
        },
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    service = module.get<TableService>(TableService);
    repo = module.get<Repository<TableEntity>>(getRepositoryToken(TableEntity));
    tableRepo = module.get<TableRepository>(TableRepository);
    groupsService = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTables', () => {
    it('should query and return tables list', async () => {
      const mockResult = [[{ id: 1, name: 'T1' }], 1];
      mockRepository.findAndCount.mockResolvedValue(mockResult);

      const res = await service.getAllTables(1, 10, 1);
      expect(res.data).toEqual(mockResult[0]);
      expect(res.total).toBe(1);
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('getTableById', () => {
    it('should find one table by id', async () => {
      const mockT = { id: 1, name: 'T1' };
      mockRepository.findOne.mockResolvedValue(mockT);

      const res = await service.getTableById(1);
      expect(res).toEqual(mockT);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('getAgentGroupData', () => {
    it('returns only selected tables belonging to the group', async () => {
      mockRepository.find.mockResolvedValue([
        { tableName: 'users', groupId: 1 },
        { tableName: 'orders', groupId: 1 },
      ]);
      mockGroupsService.getGroupById.mockResolvedValue({ databasePath: 'db' });
      mockTableRepository.fetchTableDetails.mockResolvedValue({
        rawColumns: [{ name: 'id', type: 'INTEGER' }],
        sampleData: [],
        rowCount: 1,
      });

      const result = await service.getAgentGroupData(1, [
        'users',
        'other_group_table',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].tableName).toBe('users');
      expect(tableRepo.fetchTableDetails).toHaveBeenCalledTimes(1);
    });

    it('throws when no requested tables belong to the group', async () => {
      mockRepository.find.mockResolvedValue([{ tableName: 'users', groupId: 1 }]);

      await expect(service.getAgentGroupData(1, ['orders'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getColumns', () => {
    it('should return mapped column details', async () => {
      mockRepository.findOne.mockResolvedValue({ tableName: 'test_table' });
      mockTableRepository.fetchTableDetails.mockResolvedValue({
        rawColumns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'name', type: 'TEXT' },
        ],
      });

      const cols = await service.getColumns('test_table');
      expect(cols).toEqual([
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
      ]);
    });

    it('should throw BadRequestException if table is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.getColumns('t')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
