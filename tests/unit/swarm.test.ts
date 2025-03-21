import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import './setup';
import { Agent } from '../core/agent/base';
import { Swarm } from '../core/agent/swarm';

// Create mock agent class
class MockAgent extends Agent {
  public processCount = 0;
  public lastMessage: string | null = null;
  
  constructor(name: string) {
    super({
      name: name,
      description: 'Mock agent for testing',
      llmProvider: 'openai',
      systemPrompt: 'You are a mock agent',
      maxRetries: 3
    });
  }
  
  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }
  
  async processMessage(message: string): Promise<string> {
    this.processCount++;
    this.lastMessage = message;
    return `Agent ${this.getConfig().name} processed: ${message}`;
  }
}

describe('Swarm', () => {
  let swarm: Swarm;
  let agents: MockAgent[];
  
  beforeEach(() => {
    // Create mock agents
    agents = [
      new MockAgent('agent-1'),
      new MockAgent('agent-2'),
      new MockAgent('agent-3')
    ];
    
    // Create swarm
    swarm = new Swarm({
      name: 'test-swarm',
      description: 'Test swarm for unit testing',
      agents: agents,
      coordinationStrategy: 'round-robin'
    });
  });
  
  test('should initialize all agents', async () => {
    await swarm.initialize();
    
    agents.forEach(agent => {
      expect(agent.isInitialized()).toBe(true);
    });
    
    expect(swarm.isInitialized()).toBe(true);
  });
  
  test('should broadcast messages to all agents', async () => {
    await swarm.initialize();
    
    const message = 'Hello swarm';
    await swarm.broadcastMessage(message);
    
    agents.forEach(agent => {
      expect(agent.lastMessage).toBe(message);
      expect(agent.processCount).toBe(1);
    });
  });
  
  test('should return aggregated responses from agents', async () => {
    await swarm.initialize();
    
    const message = 'Test message';
    const responses = await swarm.processMessage(message);
    
    expect(responses.length).toBe(agents.length);
    
    agents.forEach((agent, index) => {
      expect(responses[index].agent).toBe(agent.getConfig().name);
      expect(responses[index].response).toBe(`Agent ${agent.getConfig().name} processed: ${message}`);
    });
  });
  
  test('should handle agent errors gracefully', async () => {
    await swarm.initialize();
    
    // Make one agent throw an error
    const errorAgent = agents[1];
    const originalProcessMessage = errorAgent.processMessage.bind(errorAgent);
    
    // Use type assertion to fix type issue
    errorAgent.processMessage = jest.fn().mockImplementation(async (): Promise<string> => {
      throw new Error('Test error');
    });
    
    const message = 'Error test';
    const responses = await swarm.processMessage(message);
    
    // Should still get responses from other agents
    expect(responses.length).toBe(agents.length - 1);
    
    // Restore original implementation
    errorAgent.processMessage = originalProcessMessage;
  });
}); 