import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, LLMConfig, LLMResponse, Message } from '../provider';

export interface AnthropicConfig extends LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;
  private static DEFAULT_MODEL = 'claude-3-opus-20240229';

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: 'dummy' }); // Will be initialized properly in init()
  }

  async init(config: AnthropicConfig): Promise<void> {
    this.validateConfig(config);
    this.config = {
      ...config,
      model: config.model || AnthropicProvider.DEFAULT_MODEL,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000
    };

    this.client = new Anthropic({
      apiKey: config.apiKey
    });
  }

  async complete(messages: Message[]): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model as string,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const completion = response.content[0]?.text || '';
      
      return {
        content: completion,
        usage: {
          promptTokens: 0, // Anthropic doesn't provide token usage info
          completionTokens: 0,
          totalTokens: 0
        },
        raw: response
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async *streamComplete(messages: Message[]): AsyncGenerator<string> {
    try {
      const stream = await this.client.messages.create({
        model: this.config.model as string,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.delta?.text;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't provide an API to list models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  getName(): string {
    return 'Anthropic';
  }

  validateConfig(config: AnthropicConfig): boolean {
    this.validateBaseConfig(config);
    
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      throw new Error('Temperature must be between 0 and 1');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }

    return true;
  }
} 