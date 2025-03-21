import { EventEmitter } from 'events';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  topP?: number;
  [key: string]: any; // Allow provider-specific configuration
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  raw?: any; // Raw provider response
}

/**
 * Base class for LLM providers
 */
export class LLMProvider extends EventEmitter {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    super();
    this.config = {
      ...config,
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
      topP: config.topP || 0.9
    };
  }

  /**
   * Initialize the provider with configuration
   */
  async init(config: LLMConfig): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate a completion from the provider
   */
  async complete(messages: Message[]): Promise<LLMResponse> {
    throw new Error('Method not implemented');
  }

  /**
   * Send a prompt to the LLM and get a response
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const messages = this.createChatPrompt(prompt, systemPrompt);
    return await this.complete(messages);
  }

  /**
   * Stream a completion from the provider
   */
  async *streamComplete(messages: Message[]): AsyncGenerator<string> {
    throw new Error('Method not implemented');
  }

  /**
   * Get the provider's name
   */
  getName(): string {
    return this.config.provider || 'base';
  }

  /**
   * Get available models from the provider
   */
  async getAvailableModels(): Promise<string[]> {
    return [];
  }

  /**
   * Validate the configuration
   */
  validateConfig(config: LLMConfig): boolean {
    return this.validateBaseConfig(config);
  }

  /**
   * Create a chat prompt with the provided messages
   */
  protected createChatPrompt(userPrompt: string, systemPrompt?: string): Message[] {
    const messages: Message[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: userPrompt
    });
    
    return messages;
  }

  /**
   * Validate the base configuration
   */
  protected validateBaseConfig(config: LLMConfig): boolean {
    if (!config.apiKey) {
      throw new Error(`${this.getName()} provider requires an API key`);
    }
    return true;
  }

  /**
   * Factory method to create the correct provider instance
   */
  static createProvider(config: LLMConfig): LLMProvider {
    // In a real implementation, this would create the appropriate provider based on config.provider
    return new LLMProvider(config);
  }
} 