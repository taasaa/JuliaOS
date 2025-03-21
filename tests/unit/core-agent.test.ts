import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import './setup';
import { Agent } from '../core/agent/base';

// Mock the LLM provider
jest.mock('../../src/core/llm/provider', () => {
  return {
    LLMProvider: jest.fn().mockImplementation(() => {
      return {
        sendPrompt: jest.fn().mockResolvedValue({
          content: 'Mock LLM response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }),
        provider: 'mock-provider'
      };
    })
  };
});

class TestAgent extends Agent {
  public lastMessage: string | null = null;
  
  constructor() {
    super({
      name: 'test-agent',
      description: 'Test agent for unit testing',
      llmProvider: 'mock-provider',
      systemPrompt: 'You are a test agent',
      maxRetries: 3
    });
  }
  
  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }
  
  async processMessage(message: string): Promise<string> {
    this.lastMessage = message;
    return `Processed: ${message}`;
  }
}

describe('Agent Core', () => {
  let agent: TestAgent;
  
  beforeEach(() => {
    agent = new TestAgent();
  });
  
  test('should initialize correctly', async () => {
    await agent.initialize();
    expect(agent.isInitialized()).toBe(true);
    expect(agent.getConfig().name).toBe('test-agent');
  });
  
  test('should process messages', async () => {
    const message = 'Hello agent';
    const response = await agent.processMessage(message);
    
    expect(agent.lastMessage).toBe(message);
    expect(response).toBe('Processed: Hello agent');
  });
  
  test('should emit events', async () => {
    const messageHandler = jest.fn();
    agent.on('message:received', messageHandler);
    
    // Initialize agent
    await agent.initialize();
    
    // Send message through agent
    await agent.sendMessage('test message', 'user');
    
    expect(messageHandler).toHaveBeenCalledWith({ content: 'test message', sender: 'user' });
  });
}); 