import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OpenAIProvider } from '../providers/openai';
import { Message } from '../provider';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources';

jest.mock('openai');

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const mockConfig = {
    apiKey: 'test-key',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider();
  });

  it('should initialize with correct configuration', async () => {
    await provider.init(mockConfig);
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: mockConfig.apiKey
    });
  });

  it('should validate configuration correctly', () => {
    expect(() => provider.validateConfig({ apiKey: 'test-key' })).not.toThrow();
    expect(() => provider.validateConfig({ apiKey: '' })).toThrow();
    expect(() => provider.validateConfig({ 
      apiKey: 'test-key',
      temperature: 3
    })).toThrow();
    expect(() => provider.validateConfig({ 
      apiKey: 'test-key',
      maxTokens: 0
    })).toThrow();
  });

  it('should complete messages successfully', async () => {
    const mockResponse = {
      id: 'mock-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        message: { content: 'Test response', role: 'assistant' },
        index: 0,
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };

    const mockCreate = jest.fn().mockResolvedValue(mockResponse as unknown as ChatCompletion);
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));

    await provider.init(mockConfig);
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const response = await provider.complete(messages);

    expect(response.content).toBe('Test response');
    expect(response.usage).toEqual({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30
    });
    expect(mockCreate).toHaveBeenCalledWith({
      model: mockConfig.model,
      messages,
      temperature: mockConfig.temperature,
      max_tokens: mockConfig.maxTokens
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('API Error');
    const mockCreate = jest.fn().mockRejectedValue(mockError as unknown as Error);
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));

    await provider.init(mockConfig);
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];

    let errorEmitted = false;
    provider.on('error', (error) => {
      expect(error).toBe(mockError);
      errorEmitted = true;
    });

    await expect(provider.complete(messages)).rejects.toThrow(mockError);
    expect(errorEmitted).toBe(true);
  });

  it('should stream completions correctly', async () => {
    const mockChunks = [
      { 
        id: 'chunk-1',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{ delta: { content: 'Hello', role: 'assistant' } }]
      },
      {
        id: 'chunk-2',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{ delta: { content: ' world', role: 'assistant' } }]
      },
      {
        id: 'chunk-3',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{ delta: { content: '!', role: 'assistant' } }]
      }
    ];

    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of mockChunks) {
          yield chunk as unknown as ChatCompletion;
        }
      }
    };

    const mockCreate = jest.fn().mockResolvedValue(mockStream as unknown as AsyncIterable<ChatCompletion>);
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));

    await provider.init(mockConfig);
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const stream = provider.streamComplete(messages);

    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Hello', ' world', '!']);
    expect(mockCreate).toHaveBeenCalledWith({
      model: mockConfig.model,
      messages,
      temperature: mockConfig.temperature,
      max_tokens: mockConfig.maxTokens,
      stream: true
    });
  });
}); 