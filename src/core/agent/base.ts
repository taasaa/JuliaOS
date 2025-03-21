import { EventEmitter } from 'events';
import { LLMProvider } from '../llm/provider';

export interface AgentConfig {
  name: string;
  description: string;
  llmProvider: string;
  systemPrompt: string;
  maxRetries: number;
  capabilities?: string[];
}

/**
 * Base Agent class that provides core agent functionality
 * All specialized agents should extend this class
 */
export abstract class Agent extends EventEmitter {
  protected config: AgentConfig;
  protected initialized: boolean = false;
  protected llmProvider?: LLMProvider;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    
    // Validate required config properties
    if (!config.name) throw new Error('Agent requires a name');
    if (!config.description) throw new Error('Agent requires a description');
  }

  /**
   * Initialize the agent
   * Should be implemented by subclasses
   */
  abstract initialize(): Promise<void>;

  /**
   * Process a message and return a response
   * @param message The message to process
   */
  abstract processMessage(message: string): Promise<string>;

  /**
   * Check if the agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Send a message to the agent
   * @param message The message content
   * @param sender The sender of the message
   */
  async sendMessage(message: string, sender: string = 'user'): Promise<string> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    // Emit message received event
    this.emit('message:received', { content: message, sender });
    
    try {
      // Process the message
      const response = await this.processMessage(message);
      
      // Emit message sent event
      this.emit('message:sent', { content: response, recipient: sender });
      
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
} 