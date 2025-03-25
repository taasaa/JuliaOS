import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom error class for JuliaBridge errors
 */
export class JuliaBridgeError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'JuliaBridgeError';
    this.code = code;
  }
}

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
    try {
      // Determine the Julia project path more robustly with platform-specific handling
      let juliaProjectPath;
      if (process.platform === 'win32') {
        // Windows path handling
        juliaProjectPath = path.resolve(process.cwd(), 'packages', 'julia-bridge');
      } else {
        // Unix path handling
        juliaProjectPath = path.join(process.cwd(), 'packages', 'julia-bridge');
      }
      
      // Check if Julia environment exists with better error handling
      const projectTomlPath = path.join(juliaProjectPath, 'Project.toml');
      if (!fs.existsSync(projectTomlPath)) {
        throw new JuliaBridgeError(
          `Julia project environment not found at ${projectTomlPath}. Check that Julia is properly installed.`,
          'PROJECT_NOT_FOUND'
        );
      }
      
      // Prepare command arguments with explicit script path
      const initScript = path.join(juliaProjectPath, 'src', 'JuliaOS.jl');
      const juliaArgs = [
        `--project=${juliaProjectPath}`,
        '-e',
        `include("${initScript.replace(/\\/g, '\\\\')}")`
      ];
      
      // Start Julia process with improved error handling
      this.juliaProcess = spawn(this.juliaPath, juliaArgs);
      
      // Set up event handlers with better error logging
      if (this.juliaProcess.stdout) {
        this.juliaProcess.stdout.on('data', (data: Buffer) => this.handleJuliaOutput(data));
      } else {
        throw new JuliaBridgeError('Julia process stdout is not available', 'PROCESS_ERROR');
      }

      if (this.juliaProcess.stderr) {
        this.juliaProcess.stderr.on('data', (data: Buffer) => {
          const errorMsg = data.toString().trim();
          console.error(`Julia stderr: ${errorMsg}`);
          this.emit('error', new JuliaBridgeError(`Julia error: ${errorMsg}`, 'JULIA_STDERR'));
        });
      }

      this.juliaProcess.on('close', (code) => {
        this.isInitialized = false;
        console.log(`Julia process closed with code ${code}`);
        this.emit('disconnected', { code });
        
        // Handle reconnection
        if (code !== 0 && this.autoReconnect) {
          this.handleReconnect();
        }
      });

      this.juliaProcess.on('error', (error) => {
        console.error('Julia process error:', error);
        this.emit('error', new JuliaBridgeError(`Julia process error: ${error.message}`, 'PROCESS_ERROR'));
        this.isInitialized = false;
        
        if (this.autoReconnect) {
          this.handleReconnect();
        }
      });
    } catch (error) {
      console.error('Failed to start Julia process:', error);
      throw new JuliaBridgeError(
        `Failed to start Julia process: ${error instanceof Error ? error.message : String(error)}`,
        'PROCESS_START_ERROR'
      );
    }
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
    const outputStr = data.toString().trim();
    
    try {
      // Try to parse as JSON
      const response = JSON.parse(outputStr);
      
      if (response.id && this.pendingCommands.has(response.id)) {
        const { resolve, reject, timeout } = this.pendingCommands.get(response.id)!;
        clearTimeout(timeout);
        this.pendingCommands.delete(response.id);
        
        if (response.error) {
          reject(new JuliaBridgeError(response.error.message || 'Unknown Julia error', response.error.code || 'JULIA_ERROR'));
        } else {
          resolve(response.result);
        }
      } else if (response.event) {
        // Handle events from Julia
        this.emit(response.event, response.data);
      }
    } catch (error) {
      // Not JSON or invalid JSON
      if (outputStr.includes('ERROR:')) {
        this.emit('error', new JuliaBridgeError(`Julia error: ${outputStr}`, 'JULIA_RUNTIME_ERROR'));
      } else {
        // Just log as debug output
        this.emit('stdout', outputStr);
      }
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

  private sendCommand(command: string, data?: any, retryCount: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.juliaProcess || !this.juliaProcess.stdin) {
        return reject(new JuliaBridgeError('Julia process not running', 'PROCESS_NOT_RUNNING'));
      }
      
      const id = uuidv4();
      const message = JSON.stringify({ id, command, data });
      
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        
        // Retry logic for timeouts
        if (retryCount < 3) {
          console.warn(`Command ${command} timed out, retrying (${retryCount + 1}/3)...`);
          this.sendCommand(command, data, retryCount + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new JuliaBridgeError(`Command ${command} timed out after ${retryCount + 1} attempts`, 'COMMAND_TIMEOUT'));
        }
      }, 30000);
      
      this.pendingCommands.set(id, { resolve, reject, timeout });
      
      try {
        this.juliaProcess.stdin.write(message + '\n');
      } catch (error) {
        clearTimeout(timeout);
        this.pendingCommands.delete(id);
        reject(new JuliaBridgeError(`Failed to send command to Julia process: ${error instanceof Error ? error.message : String(error)}`, 'WRITE_FAILED'));
      }
    });
  }

  async shutdown(): Promise<void> {
    try {
      // Stop all swarms
      await this.stopSwarm();
      
      // Send shutdown command with timeout
      const shutdownPromise = this.sendCommand('shutdown');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new JuliaBridgeError('Shutdown command timed out', 'SHUTDOWN_TIMEOUT')), 5000)
      );
      
      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error during shutdown:', error);
      // Continue with shutdown process even if there was an error
    } finally {
      // Clean up all pending commands
      for (const [id, { reject, timeout }] of this.pendingCommands.entries()) {
        clearTimeout(timeout);
        reject(new JuliaBridgeError('Bridge is shutting down', 'SHUTDOWN'));
        this.pendingCommands.delete(id);
      }
      
      // Kill Julia process
      if (this.juliaProcess) {
        this.juliaProcess.kill();
        this.juliaProcess = null;
      }
      
      this.isInitialized = false;
      this.activeSwarms.clear();
    }
  }
} 