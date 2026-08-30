import { Test, TestingModule } from '@nestjs/testing';
import { TableController } from './table.controller';
import { TableService } from './table.service';

describe('TableController', () => {
  let controller: TableController;
  let service: TableService;

  const mockTableService = {
    getAllTables: jest.fn(),
    getColumns: jest.fn(),
    getTableData: jest.fn(),
    parseAndSaveFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableController],
      providers: [
        {
          provide: TableService,
          useValue: mockTableService,
        },
      ],
    }).compile();

    controller = module.get<TableController>(TableController);
    service = module.get<TableService>(TableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTables', () => {
    it('should call getAllTables and return results', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10 };
      mockTableService.getAllTables.mockResolvedValue(mockResult);

      const res = await controller.getTables({
        page: 1,
        limit: 10,
        groupId: 1,
      });
      expect(service.getAllTables).toHaveBeenCalledWith(1, 10, 1);
      expect(res).toEqual(mockResult);
    });
  });

  describe('getColumns', () => {
    it('should call getColumns on service', async () => {
      const mockCols = [{ name: 'id', type: 'number' }];
      mockTableService.getColumns.mockResolvedValue(mockCols);

      const res = await controller.getColumns('t_name');
      expect(service.getColumns).toHaveBeenCalledWith('t_name');
      expect(res).toEqual(mockCols);
    });
  });

  describe('getTableData', () => {
    it('should call getTableData on service', async () => {
      const mockData = { data: [], total: 0, page: 0, limit: 20 };
      mockTableService.getTableData.mockResolvedValue(mockData);

      const res = await controller.getTableData('t_name', {
        page: 0,
        limit: 20,
      });
      expect(service.getTableData).toHaveBeenCalledWith('t_name', 0, 20);
      expect(res).toEqual(mockData);
    });
  });

  describe('uploadTable', () => {
    it('should call parseAndSaveFile on service', async () => {
      const mockFile = { buffer: Buffer.from('') } as Express.Multer.File;
      const uploadDto = { name: 'tbl', groupId: 1 };
      mockTableService.parseAndSaveFile.mockResolvedValue({ rowCount: 0 });

      await controller.uploadTable(mockFile, uploadDto);
      expect(service.parseAndSaveFile).toHaveBeenCalledWith(mockFile, 'tbl', 1);
    });
  });
});
