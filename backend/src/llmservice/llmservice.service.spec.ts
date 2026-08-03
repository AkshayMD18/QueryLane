import { Test, TestingModule } from '@nestjs/testing';
import { LlmserviceService } from './llmservice.service';

jest.mock('@langchain/openrouter', () => {
  return {
    ChatOpenRouter: jest.fn().mockImplementation(() => {
      return {
        invoke: jest.fn().mockResolvedValue({ content: 'Mocked LLM Response' }),
      };
    }),
  };
});

describe('LlmserviceService', () => {
  let service: LlmserviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmserviceService],
    }).compile();

    service = module.get<LlmserviceService>(LlmserviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('callOpenRouter', () => {
    it('should invoke model and return response content', async () => {
      const response = await service.callOpenRouter('hello');
      expect(response).toBe('Mocked LLM Response');
    });
  });

  describe('getModel', () => {
    it('should return the model instance', () => {
      const model = service.getModel();
      expect(model).toBeDefined();
    });
  });
});
