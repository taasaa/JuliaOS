import OpenAI from 'openai';
import { BaseLLMProvider, LLMConfig, LLMResponse, Message } from '../provider';

export interface OpenAIConfig extends LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organization?: string;
}

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;
  private static DEFAULT_MODEL = 'gpt-3.5-turbo';

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: 'dummy' }); // Will be initialized properly in init()
  }

  async init(config: OpenAIConfig): Promise<void> {
    this.validateConfig(config);
    this.config = {
      ...config,
      model: config.model || OpenAIProvider.DEFAULT_MODEL,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000
    };

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization
    });
  }

  async complete(messages: Message[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model as string,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const completion = response.choices[0]?.message?.content || '';
      
      return {
        content: completion,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
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
      const stream = await this.client.chat.completions.create({
        model: this.config.model as string,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
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
    try {
      const models = await this.client.models.list();
      return models.data
        .filter(model => model.id.startsWith('gpt'))
        .map(model => model.id);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  getName(): string {
    return 'OpenAI';
  }

  validateConfig(config: OpenAIConfig): boolean {
    this.validateBaseConfig(config);
    
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }

    return true;
  }
} 