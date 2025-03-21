import { LLMProvider, LLMConfig } from './provider';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'grok' | 'llama';

// A registry of all available providers
const providerRegistry: Record<string, typeof LLMProvider> = {};

/**
 * Register a provider implementation
 * @param name Provider name
 * @param providerClass Provider class
 */
export function registerProvider(name: string, providerClass: typeof LLMProvider): void {
  providerRegistry[name] = providerClass;
}

/**
 * Create a provider instance
 * @param config Provider configuration
 */
export function createProvider(config: LLMConfig): LLMProvider {
  const providerName = config.provider || 'default';
  
  // Check if the provider is registered
  if (!providerRegistry[providerName]) {
    throw new Error(`Provider ${providerName} is not registered`);
  }
  
  // Create an instance of the provider
  return new providerRegistry[providerName](config);
}

/**
 * Get all registered providers
 */
export function getRegisteredProviders(): string[] {
  return Object.keys(providerRegistry);
}

// Register the default provider
registerProvider('default', LLMProvider);

export class LLMProviderFactory {
  private static instance: LLMProviderFactory;
  private providers: Map<ProviderType, new () => LLMProvider>;

  private constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  public static getInstance(): LLMProviderFactory {
    if (!LLMProviderFactory.instance) {
      LLMProviderFactory.instance = new LLMProviderFactory();
    }
    return LLMProviderFactory.instance;
  }

  private registerDefaultProviders() {
    this.providers.set('openai', OpenAIProvider);
    this.providers.set('anthropic', AnthropicProvider);
  }

  public registerProvider(type: ProviderType, providerClass: new () => LLMProvider) {
    this.providers.set(type, providerClass);
  }

  public async createProvider(type: ProviderType, config: LLMConfig): Promise<LLMProvider> {
    const ProviderClass = this.providers.get(type);
    if (!ProviderClass) {
      throw new Error(`Provider type '${type}' is not registered`);
    }

    const provider = new ProviderClass();
    await provider.init(config);
    return provider;
  }

  public getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  public isProviderAvailable(type: ProviderType): boolean {
    return this.providers.has(type);
  }
} 