import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { TableService } from '../table/table.service';

describe('AgentsController', () => {
  let controller: AgentsController;
  let agentsService: AgentsService;
  let tableService: TableService;

  const mockAgentsService = {
    generateAnalysisTasks: jest.fn(),
    generateQuery: jest.fn(),
    generateQueryForMultipleTables: jest.fn(),
  };

  const mockTableService = {
    getAgentTableData: jest.fn(),
    getAgentGroupData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
        {
          provide: TableService,
          useValue: mockTableService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    agentsService = module.get<AgentsService>(AgentsService);
    tableService = module.get<TableService>(TableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateTasks', () => {
    it('should generate analysis tasks', async () => {
      const mockTableData = { tableName: 'users' };
      const mockTasks = { recommendation: ['task 1'] };

      mockTableService.getAgentTableData.mockResolvedValue(mockTableData);
      mockAgentsService.generateAnalysisTasks.mockResolvedValue(mockTasks);

      const res = await controller.generateTasks('users');
      expect(tableService.getAgentTableData).toHaveBeenCalledWith('users');
      expect(agentsService.generateAnalysisTasks).toHaveBeenCalledWith(mockTableData);
      expect(res).toEqual(mockTasks);
    });
  });

  describe('query', () => {
    it('should call generateQuery on agents service', async () => {
      const mockTableData = { tableName: 'users' };
      const mockQueryRes = { SQLiteQuery: 'SELECT *' };

      mockTableService.getAgentTableData.mockResolvedValue(mockTableData);
      mockAgentsService.generateQuery.mockResolvedValue(mockQueryRes);

      const res = await controller.query('users', 'get users');
      expect(tableService.getAgentTableData).toHaveBeenCalledWith('users');
      expect(agentsService.generateQuery).toHaveBeenCalledWith({ ...mockTableData, query: 'get users' });
      expect(res).toEqual(mockQueryRes);
    });
  });

  describe('joinQuery', () => {
    it('should call generateQueryForMultipleTables', async () => {
      const mockGroupData = [{ tableName: 'users' }];
      const mockQueryRes = { SQLiteQuery: 'SELECT *' };

      mockTableService.getAgentGroupData.mockResolvedValue(mockGroupData);
      mockAgentsService.generateQueryForMultipleTables.mockResolvedValue(mockQueryRes);

      const res = await controller.joinQuery('1', 'get users');
      expect(tableService.getAgentGroupData).toHaveBeenCalledWith(1);
      expect(agentsService.generateQueryForMultipleTables).toHaveBeenCalledWith({
        tableData: mockGroupData,
        query: 'get users',
      });
      expect(res).toEqual(mockQueryRes);
    });
  });
});
