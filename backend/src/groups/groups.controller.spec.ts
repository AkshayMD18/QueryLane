import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockGroupsService = {
    createGroup: jest.fn(),
    getGroupById: jest.fn(),
    getAllGroups: jest.fn(),
    getSnapshot: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createGroup and return the result', async () => {
      mockGroupsService.createGroup.mockResolvedValue(undefined);
      await controller.create({ name: 'New Group' });
      expect(service.createGroup).toHaveBeenCalledWith('New Group');
    });
  });

  describe('findOne', () => {
    it('should call getGroupById and return the group', async () => {
      const result = { id: 1, name: 'Group 1' };
      mockGroupsService.getGroupById.mockResolvedValue(result);

      const response = await controller.findOne('1');
      expect(service.getGroupById).toHaveBeenCalledWith(1);
      expect(response).toEqual(result);
    });
  });

  describe('findMany', () => {
    it('should call getAllGroups and return array of groups', async () => {
      const result = [{ id: 1, name: 'Group 1' }];
      mockGroupsService.getAllGroups.mockResolvedValue(result);

      const response = await controller.findMany();
      expect(service.getAllGroups).toHaveBeenCalled();
      expect(response).toEqual(result);
    });
  });

  describe('createPostgresSnapshot', () => {
    it('should pass database, schema, and excluded tables to the service', async () => {
      const result = {
        databaseName: 'sales',
        schemaName: 'public',
        tables: [],
      };
      mockGroupsService.getSnapshot.mockResolvedValue(result);

      const response = await controller.createPostgresSnapshot({
        databaseName: 'sales',
        schemaName: 'public',
        excludedTables: ['audit_logs'],
      });

      expect(service.getSnapshot).toHaveBeenCalledWith('sales', 'public', [
        'audit_logs',
      ]);
      expect(response).toEqual(result);
    });

    it('should pass an empty exclusion list when omitted', async () => {
      mockGroupsService.getSnapshot.mockResolvedValue({ tables: [] });

      await controller.createPostgresSnapshot({
        databaseName: 'sales',
        schemaName: 'public',
      });

      expect(service.getSnapshot).toHaveBeenCalledWith('sales', 'public', []);
    });
  });
});
