import { EventEmitter } from 'events';
import { Agent } from './base';

export interface SwarmConfig {
  name: string;
  description: string;
  agents: Agent[];
  coordinationStrategy: 'round-robin' | 'hierarchical' | 'consensus';
  coordinationParameters?: Record<string, any>;
}

export interface SwarmResponse {
  agent: string;
  response: string;
}

/**
 * Swarm class that manages multiple agents and coordinates their actions
 */
export class Swarm extends EventEmitter {
  private config: SwarmConfig;
  private initialized: boolean = false;
  private agents: Agent[] = [];

  constructor(config: SwarmConfig) {
    super();
    this.config = config;
    this.agents = config.agents;
  }

  /**
   * Initialize the swarm and all agents
   */
  async initialize(): Promise<void> {
    try {
      // Initialize all agents
      const initPromises = this.agents.map(agent => agent.initialize());
      await Promise.all(initPromises);
      
      this.initialized = true;
      this.emit('initialized', { swarmName: this.config.name });
    } catch (error) {
      this.emit('error', { error, message: 'Failed to initialize swarm' });
      throw error;
    }
  }

  /**
   * Check if the swarm is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all agents in the swarm
   */
  getAgents(): Agent[] {
    return this.agents;
  }

  /**
   * Add an agent to the swarm
   */
  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  /**
   * Remove an agent from the swarm
   */
  removeAgent(agentName: string): void {
    this.agents = this.agents.filter(agent => agent.getConfig().name !== agentName);
  }

  /**
   * Process a message using all agents in the swarm
   * Returns an array of responses from each agent
   */
  async processMessage(message: string): Promise<SwarmResponse[]> {
    if (!this.initialized) {
      throw new Error('Swarm not initialized');
    }

    try {
      // Get responses from all agents
      const responsePromises = this.agents.map(async (agent) => {
        try {
          const response = await agent.processMessage(message);
          return {
            agent: agent.getConfig().name,
            response
          };
        } catch (error) {
          this.emit('error', { 
            agent: agent.getConfig().name, 
            error, 
            message: 'Agent failed to process message' 
          });
          return null;
        }
      });

      // Wait for all responses and filter out failed ones
      const responses = (await Promise.all(responsePromises)).filter(Boolean) as SwarmResponse[];
      
      // Emit the responses event
      this.emit('responses', { responses });
      
      return responses;
    } catch (error) {
      this.emit('error', { error, message: 'Failed to process message' });
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(message: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Swarm not initialized');
    }

    try {
      // Send message to all agents
      const promises = this.agents.map(agent => agent.processMessage(message));
      await Promise.all(promises);
      
      this.emit('broadcast', { message });
    } catch (error) {
      this.emit('error', { error, message: 'Failed to broadcast message' });
      throw error;
    }
  }
} 