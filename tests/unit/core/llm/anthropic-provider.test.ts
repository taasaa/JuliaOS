import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnthropicProvider } from '../providers/anthropic';
import { Message } from '../provider';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  const mockConfig = {
    apiKey: 'test-key',
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 2000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new AnthropicProvider();
  });

  it('should initialize with correct configuration', async () => {
    await provider.init(mockConfig);
    expect(Anthropic).toHaveBeenCalledWith({
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
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Test response' }],
      model: 'claude-3-opus-20240229',
      usage: {
        input_tokens: 10,
        output_tokens: 20
      }
    };

    const mockCreate = jest.fn().mockResolvedValue(mockResponse);
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    }));

    await provider.init(mockConfig);
    const messages: Message[] = [{ role: 'user', content: 'Hello' }];
    const response = await provider.complete(messages);

    expect(response.content).toBe('Test response');
    expect(response.usage).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    });
    expect(mockCreate).toHaveBeenCalledWith({
      model: mockConfig.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: mockConfig.temperature,
      max_tokens: mockConfig.maxTokens
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('API Error');
    const mockCreate = jest.fn().mockRejectedValue(mockError);
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: {
        create: mockCreate
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
        type: 'content_block_delta',
        delta: { type: 'text', text: 'Hello' }
      },
      {
        type: 'content_block_delta',
        delta: { type: 'text', text: ' world' }
      },
      {
        type: 'content_block_delta',
        delta: { type: 'text', text: '!' }
      }
    ];

    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }
    };

    const mockCreate = jest.fn().mockResolvedValue(mockStream);
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: {
        create: mockCreate
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
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: mockConfig.temperature,
      max_tokens: mockConfig.maxTokens,
      stream: true
    });
  });
}); 