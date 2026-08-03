import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { DataSource } from 'typeorm';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGroup', () => {
    it('should successfully insert a group', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ id: 1 });

      await expect(service.createGroup('Test Group')).resolves.not.toThrow();

      expect(mockDataSource.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.into).toHaveBeenCalledWith('groups');
      expect(mockQueryBuilder.values).toHaveBeenCalledWith({ name: 'Test Group' });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should throw error if insert fails', async () => {
      const error = new Error('DB Error');
      mockQueryBuilder.execute.mockRejectedValue(error);

      await expect(service.createGroup('Test Group')).rejects.toThrow(error);
    });
  });

  describe('getAllGroups', () => {
    it('should return all groups', async () => {
      const result = [{ id: 1, name: 'Test Group' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(result);

      const groups = await service.getAllGroups();
      expect(groups).toEqual(result);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.from).toHaveBeenCalledWith('groups', 'g');
    });
  });

  describe('getGroupById', () => {
    it('should return a group by id', async () => {
      const result = { id: 1, name: 'Test Group' };
      mockQueryBuilder.getRawOne.mockResolvedValue(result);

      const group = await service.getGroupById(1);
      expect(group).toEqual(result);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('g.id = :id', { id: 1 });
    });
  });
});
