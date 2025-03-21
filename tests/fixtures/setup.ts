import { jest } from '@jest/globals';

// Mock LLM provider
jest.mock('../core/llm/provider', () => {
  return {
    LLMProvider: jest.fn().mockImplementation((config) => {
      return {
        sendPrompt: jest.fn().mockResolvedValue({
          content: 'Mock LLM response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }),
        complete: jest.fn().mockResolvedValue({
          content: 'Mock LLM response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }),
        getName: jest.fn().mockReturnValue(config.provider || 'mock-provider'),
        init: jest.fn().mockResolvedValue(undefined),
        validateConfig: jest.fn().mockReturnValue(true)
      };
    }),
    createProvider: jest.fn().mockImplementation((config) => {
      return {
        sendPrompt: jest.fn().mockResolvedValue({
          content: 'Mock LLM response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }),
        complete: jest.fn().mockResolvedValue({
          content: 'Mock LLM response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }),
        getName: jest.fn().mockReturnValue(config.provider || 'mock-provider'),
        init: jest.fn().mockResolvedValue(undefined),
        validateConfig: jest.fn().mockReturnValue(true)
      };
    })
  };
}); 