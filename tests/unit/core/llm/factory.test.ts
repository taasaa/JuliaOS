import { describe, it, expect, jest } from '@jest/globals';
import { LLMProviderFactory } from '../factory';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { BaseLLMProvider } from '../provider';

jest.mock('../providers/openai');
jest.mock('../providers/anthropic');

describe('LLMProviderFactory', () => {
  it('should be a singleton', () => {
    const instance1 = LLMProviderFactory.getInstance();
    const instance2 = LLMProviderFactory.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register default providers', () => {
    const factory = LLMProviderFactory.getInstance();
    expect(factory.isProviderAvailable('openai')).toBe(true);
    expect(factory.isProviderAvailable('anthropic')).toBe(true);
  });

  it('should create OpenAI provider', async () => {
    const factory = LLMProviderFactory.getInstance();
    const config = { apiKey: 'test-key' };
    const provider = await factory.createProvider('openai', config);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create Anthropic provider', async () => {
    const factory = LLMProviderFactory.getInstance();
    const config = { apiKey: 'test-key' };
    const provider = await factory.createProvider('anthropic', config);
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should throw error for unregistered provider', async () => {
    const factory = LLMProviderFactory.getInstance();
    const config = { apiKey: 'test-key' };
    await expect(factory.createProvider('gemini', config)).rejects.toThrow(
      "Provider type 'gemini' is not registered"
    );
  });

  it('should register custom provider', () => {
    class CustomProvider extends BaseLLMProvider {
      async init() {}
      async complete() { return { content: '' }; }
      getName() { return 'Custom'; }
      validateConfig() { return true; }
    }

    const factory = LLMProviderFactory.getInstance();
    factory.registerProvider('gemini' as any, CustomProvider);
    expect(factory.isProviderAvailable('gemini')).toBe(true);
  });

  it('should list available providers', () => {
    const factory = LLMProviderFactory.getInstance();
    const providers = factory.getAvailableProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
  });
}); 