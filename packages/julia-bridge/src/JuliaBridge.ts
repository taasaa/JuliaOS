import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SwarmConfig {
  id?: string;
  name?: string;
  size: number;
  algorithm: 'pso' | 'aco' | 'abc' | 'firefly';
  parameters: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDrawdown: number;
    inertia?: number;
    cognitiveWeight?: number;
    socialWeight?: number;
  };
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  indicators?: Record<string, number>;
}

export interface SwarmOptimizationInput {
  swarmId: string;
  marketData: MarketData[];
  tradingPairs: string[];
  riskParameters: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDrawdown: number;
  };
}

export interface TradingSignal {
  action: 'buy' | 'sell';
  amount: number;
  confidence: number;
  timestamp: Date;
  indicators: Record<string, number>;
  reasoning: string;
}

export class JuliaBridge extends EventEmitter {
  private juliaProcess: ChildProcess | null = null;
  private isInitialized: boolean = false;
  private pendingCommands: Map<string, { 
    resolve: (value: any) => void, 
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
  }> = new Map();
  private activeSwarms: Map<string, SwarmConfig> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private juliaPath: string;
  private autoReconnect: boolean;

  constructor(options: { juliaPath?: string, autoReconnect?: boolean } = {}) {
    super();
    this.juliaPath = options.juliaPath || 'julia';
    this.autoReconnect = options.autoReconnect !== false;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Start Julia process
      this.startJuliaProcess();
      
      // Wait for Julia to initialize
      await this.waitForInitialization();

      this.isInitialized = true;
      this.reconnectAttempts = 0;
      
      this.emit('initialized');
    } catch (error: unknown) {
      console.error('Failed to initialize Julia bridge:', error);
      
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
        
        setTimeout(() => {
          this.initialize().catch(e => {
            this.emit('error', new Error(`Reconnect failed: ${e.message}`));
          });
        }, delay);
      } else {
        throw new Error(`Failed to initialize Julia bridge after ${this.reconnectAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private startJuliaProcess(): void {
    // Check if Julia environment exists
    const juliaProjectPath = path.join(process.cwd(), 'packages', 'julia-bridge');
    if (!fs.existsSync(path.join(juliaProjectPath, 'Project.toml'))) {
      throw new Error('Julia project environment not found. Check that Julia is properly installed.');
    }

    // Start Julia process
    this.juliaProcess = spawn(this.juliaPath, ['--project=' + juliaProjectPath]);
    
    // Set up event handlers
    if (this.juliaProcess.stdout) {
      this.juliaProcess.stdout.on('data', (data: Buffer) => this.handleJuliaOutput(data));
    }

    if (this.juliaProcess.stderr) {
      this.juliaProcess.stderr.on('data', (data: Buffer) => {
        const errorMsg = data.toString().trim();
        this.emit('error', new Error(`Julia error: ${errorMsg}`));
      });
    }

    this.juliaProcess.on('close', (code) => {
      this.isInitialized = false;
      this.emit('disconnected', { code });
      
      // Handle reconnection
      if (code !== 0 && this.autoReconnect) {
        this.handleReconnect();
      }
    });

    this.juliaProcess.on('error', (error) => {
      this.emit('error', error);
      this.isInitialized = false;
      
      if (this.autoReconnect) {
        this.handleReconnect();
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
      
      setTimeout(() => {
        this.initialize().catch(e => {
          this.emit('error', new Error(`Reconnect failed: ${e.message}`));
        });
      }, delay);
    } else {
      this.emit('reconnect_failed', { attempts: this.reconnectAttempts });
    }
  }

  private waitForInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Julia initialization timeout'));
      }, 10000);

      const handler = (data: Buffer) => {
        const message = data.toString().trim();
        if (message.includes('Julia initialized')) {
          clearTimeout(timeout);
          if (this.juliaProcess && this.juliaProcess.stdout) {
            this.juliaProcess.stdout.removeListener('data', handler);
          }
          resolve();
        }
      };

      if (this.juliaProcess && this.juliaProcess.stdout) {
        this.juliaProcess.stdout.on('data', handler);
      } else {
        reject(new Error('Julia process not started'));
      }
    });
  }

  private handleJuliaOutput(data: Buffer): void {
    const message = data.toString().trim();
    
    // Handle special messages
    if (message.startsWith('ERROR:')) {
      this.emit('error', new Error(message.substring(6)));
      return;
    } else if (message.startsWith('INFO:')) {
      this.emit('info', message.substring(5));
      return;
    }
    
    // Try to parse as JSON response
    try {
      const response = JSON.parse(message);
      if (response.id && this.pendingCommands.has(response.id)) {
        const { resolve, reject, timeout } = this.pendingCommands.get(response.id)!;
        clearTimeout(timeout);
        this.pendingCommands.delete(response.id);
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      } else if (response.event) {
        // Handle event messages from Julia
        this.emit(response.event, response.data);
      }
    } catch (error) {
      // Not JSON, just log
      this.emit('output', message);
    }
  }

  async startSwarm(config: SwarmConfig): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Julia bridge is not initialized');
    }

    try {
      // Generate swarm ID if not provided
      const swarmId = config.id || uuidv4();
      const swarmConfig = { ...config, id: swarmId };
      
      // Send swarm configuration to Julia
      await this.sendCommand('start_swarm', swarmConfig);
      
      // Store active swarm
      this.activeSwarms.set(swarmId, swarmConfig);
      
      return swarmId;
    } catch (error) {
      console.error('Failed to start swarm:', error);
      throw error;
    }
  }

  async stopSwarm(swarmId?: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Julia bridge is not initialized');
    }

    try {
      if (swarmId) {
        // Stop specific swarm
        await this.sendCommand('stop_swarm', { swarmId });
        this.activeSwarms.delete(swarmId);
      } else {
        // Stop all swarms
        for (const [id] of this.activeSwarms) {
          await this.sendCommand('stop_swarm', { swarmId: id });
        }
        this.activeSwarms.clear();
      }
    } catch (error) {
      console.error('Failed to stop swarm:', error);
      throw error;
    }
  }

  async optimizeSwarm(input: SwarmOptimizationInput): Promise<TradingSignal> {
    if (!this.isInitialized) {
      throw new Error('Julia bridge is not initialized');
    }

    try {
      // Validate swarm exists
      if (!this.activeSwarms.has(input.swarmId)) {
        throw new Error(`Swarm with ID ${input.swarmId} not found`);
      }
      
      // Send optimization request to Julia
      const response = await this.sendCommand('optimize_swarm', input);
      return response as TradingSignal;
    } catch (error) {
      console.error('Failed to optimize swarm:', error);
      throw error;
    }
  }

  async getSwarmStatus(swarmId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Julia bridge is not initialized');
    }

    try {
      return await this.sendCommand('get_swarm_status', { swarmId });
    } catch (error) {
      console.error('Failed to get swarm status:', error);
      throw error;
    }
  }

  async getActiveSwarms(): Promise<string[]> {
    return Array.from(this.activeSwarms.keys());
  }

  private sendCommand(command: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.juliaProcess || !this.juliaProcess.stdin) {
        return reject(new Error('Julia process not running'));
      }
      
      const id = uuidv4();
      const message = JSON.stringify({ id, command, data });
      
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Command ${command} timeout`));
      }, 30000);
      
      this.pendingCommands.set(id, { resolve, reject, timeout });
      
      this.juliaProcess.stdin.write(message + '\n');
    });
  }

  async shutdown(): Promise<void> {
    try {
      // Stop all swarms
      await this.stopSwarm();
      
      // Send shutdown command
      await this.sendCommand('shutdown');
    } catch (error) {
      console.error('Error during shutdown:', error);
    } finally {
      // Kill Julia process
      if (this.juliaProcess) {
        this.juliaProcess.kill();
        this.juliaProcess = null;
      }
      
      this.isInitialized = false;
      this.pendingCommands.clear();
      this.activeSwarms.clear();
    }
  }
} 