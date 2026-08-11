import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { LlmserviceService } from '../llmservice/llmservice.service';
import { DataSource } from 'typeorm';

jest.mock('@langchain/core/prompts', () => {
  return {
    ChatPromptTemplate: {
      fromMessages: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          invoke: jest
            .fn()
            .mockResolvedValue({ recommendation: ['Analyze active users'] }),
        }),
      }),
    },
  };
});

describe('AgentsService', () => {
  let service: AgentsService;

  const mockLlmService = {
    getModel: jest.fn().mockReturnValue({
      withStructuredOutput: jest.fn(),
    }),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: LlmserviceService,
          useValue: mockLlmService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnalysisTasks', () => {
    it('should generate recommendations', async () => {
      const mockTableData = {
        tableName: 'users',
        columns: ['id', 'status'],
        columnTypes: { id: 'number', status: 'string' },
        sampleData: [],
        rowCount: 0,
      };

      const result = await service.generateAnalysisTasks(mockTableData);
      expect(result).toEqual({ recommendation: ['Analyze active users'] });
    });
  });
});
