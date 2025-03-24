import { EventEmitter } from 'events';
import WebSocket from 'ws';
import * as path from 'path';
import { z } from 'zod';
import { ConfigManager } from '../config/ConfigManager';
import * as JuliaTypes from '../types/JuliaTypes';
import { v4 as uuidv4 } from 'uuid';

// Enhanced type definitions
export interface JuliaBridgeConfig {
  juliaPath: string;
  scriptPath: string;
  port: number;
  options?: JuliaBridgeOptions;
}

export interface JuliaBridgeOptions {
  debug?: boolean;
  timeout?: number;
  maxRetries?: number;
  reconnectInterval?: number;
  artificialDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  maxQueueSize?: number;
  backoffMultiplier?: number;
  env?: Record<string, string>;
  projectPath?: string;
  depotPath?: string;
}

export interface SwarmOptimizationParams {
  algorithm: 'pso' | 'aco' | 'abc' | 'firefly';
  dimensions: number;
  populationSize: number;
  iterations: number;
  bounds: {
    min: number[];
    max: number[];
  };
  objectiveFunction: string;
}

export interface JuliaResponse {
  id: string;
  type: string;
  data: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    memoryUsage?: number;
    workerId?: number;
  };
}

// Enhanced validation schemas
const SwarmOptimizationParamsSchema = z.object({
  algorithm: z.enum(['pso', 'aco', 'abc', 'firefly']),
  dimensions: z.number().int().positive(),
  populationSize: z.number().int().positive(),
  iterations: z.number().int().positive(),
  bounds: z.object({
    min: z.array(z.number()),
    max: z.array(z.number())
  }),
  objectiveFunction: z.string()
});

const MessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.any(),
  error: z.string().optional(),
  metadata: z.object({
    executionTime: z.number().optional(),
    memoryUsage: z.number().optional(),
    workerId: z.number().optional()
  }).optional()
});

export class JuliaBridge extends EventEmitter {
  private config: JuliaBridgeConfig;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private messageQueue: Array<{
    message: any;
    resolve: (value: JuliaTypes.JuliaResponse) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private isReconnecting: boolean = false;
  private juliaProcess: any = null;
  private pendingRequests: Map<string, {
    resolve: (value: JuliaTypes.JuliaResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout | null;
  }> = new Map();

  constructor(config?: Partial<JuliaBridgeConfig>) {
    super();
    
    // If no config is provided, use ConfigManager to get the default configuration
    if (!config) {
      const configManager = ConfigManager.getInstance();
      this.config = configManager.getBridgeConfig();
    } else {
      // Merge provided config with defaults
      const configManager = ConfigManager.getInstance();
      const defaultConfig = configManager.getBridgeConfig();
      
      this.config = {
        juliaPath: config.juliaPath || defaultConfig.juliaPath,
        scriptPath: config.scriptPath || defaultConfig.scriptPath,
        port: config.port || defaultConfig.port,
        options: {
          ...defaultConfig.options,
          ...config.options
        }
      };
    }
  }

  /**
   * Initialize the Julia bridge
   */
  async initialize(): Promise<void> {
    try {
      // Set up Julia environment variables
      if (this.config.options?.projectPath) {
        process.env.JULIA_PROJECT = this.config.options.projectPath;
      }
      if (this.config.options?.depotPath) {
        process.env.JULIA_DEPOT_PATH = this.config.options.depotPath;
      }

      // Start Julia process with environment variables
      const { spawn } = require('child_process');
      const juliaArgs = [
        path.join(this.config.scriptPath, 'server.jl'),
        '--port',
        this.config.port.toString()
      ];

      if (this.config.options?.debug) {
        juliaArgs.push('--debug');
      }

      this.juliaProcess = spawn(this.config.juliaPath, juliaArgs, {
        env: {
          ...process.env,
          ...this.config.options?.env
        }
      });

      // Set up process event handlers
      this.juliaProcess.stdout.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        if (message.includes('Server started')) {
          this.connectWebSocket();
        }
        if (this.config.options?.debug) {
          console.log('Julia output:', message);
        }
      });

      this.juliaProcess.stderr.on('data', (data: Buffer) => {
        console.error('Julia error:', data.toString());
      });

      this.juliaProcess.on('error', (error: Error) => {
        console.error('Failed to start Julia process:', error);
        this.handleError(error);
      });

      this.juliaProcess.on('exit', (code: number) => {
        console.log(`Julia process exited with code ${code}`);
        this.handleDisconnect();
      });

      // Wait for connection
      await this.waitForConnection();
    } catch (error) {
      console.error('Failed to initialize JuliaBridge:', error);
      throw error;
    }
  }

  /**
   * Get the connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Connect to WebSocket
   */
  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(`ws://localhost:${this.config.port}`);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.retryCount = 0;
        this.emit('connected');
        
        // Process any queued messages
        this.processQueuedMessages();
        
        // Start heartbeat
        this.startHeartbeat();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'heartbeat') {
            this.handleHeartbeat(message);
            return;
          }
          
          // Handle response
          const requestId = message.id;
          const pendingRequest = this.pendingRequests.get(requestId);
          
          if (pendingRequest) {
            // Clear timeout
            if (pendingRequest.timeout) {
              clearTimeout(pendingRequest.timeout);
            }
            
            // Remove from pending requests
            this.pendingRequests.delete(requestId);
            
            // Resolve the promise
            if (message.error) {
              pendingRequest.reject(new Error(message.error));
            } else {
              pendingRequest.resolve(message);
            }
          }
          
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.handleError(error);
      });

      this.ws.on('close', () => {
        this.handleDisconnect();
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    if (!this.isConnected) {
      return;
    }

    this.isConnected = false;
    this.emit('disconnected');

    // Schedule reconnect
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isReconnecting || this.reconnectTimer) {
      return;
    }

    this.isReconnecting = true;
    const delay = this.calculateBackoffDelay();
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.retryCount + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.isReconnecting = false;
      this.retryCount++;
      
      if (this.retryCount > (this.config.options?.maxRetries || 3)) {
        this.emit('error', new Error('Max reconnect attempts reached'));
        return;
      }
      
      this.connectWebSocket();
    }, delay);
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoffDelay(): number {
    const baseDelay = this.config.options?.reconnectInterval || 5000;
    const multiplier = this.config.options?.backoffMultiplier || 1.5;
    return baseDelay * Math.pow(multiplier, this.retryCount);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    const interval = this.config.options?.heartbeatInterval || 30000;
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, interval);
    
    // Send initial heartbeat
    this.sendHeartbeat();
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    if (!this.isConnected || !this.ws) {
      return;
    }
    
    try {
      const heartbeat: JuliaTypes.JuliaHeartbeatMessage = {
        type: 'heartbeat',
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(heartbeat));
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      this.handleDisconnect();
    }
  }

  /**
   * Handle heartbeat
   */
  private handleHeartbeat(message: any): void {
    this.lastHeartbeat = Date.now();
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    this.emit('error', error);
    
    // Reject all pending requests
    for (const [id, request] of this.pendingRequests.entries()) {
      request.reject(error);
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Wait for connection
   */
  private async waitForConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        this.removeListener('connected', onConnected);
        this.removeListener('error', onError);
        reject(new Error('Connection timeout'));
      }, this.config.options?.timeout || 30000);
      
      const onConnected = () => {
        clearTimeout(timeout);
        this.removeListener('error', onError);
        resolve();
      };
      
      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.removeListener('connected', onConnected);
        reject(error);
      };
      
      this.once('connected', onConnected);
      this.once('error', onError);
    });
  }

  /**
   * Process queued messages
   */
  private processQueuedMessages(): void {
    const now = Date.now();
    const maxQueueAge = this.config.options?.timeout || 30000;
    
    // Filter out expired messages
    this.messageQueue = this.messageQueue.filter(item => {
      if (now - item.timestamp > maxQueueAge) {
        item.reject(new Error('Message expired'));
        return false;
      }
      return true;
    });
    
    // Process remaining messages
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const item of queue) {
      this.sendMessage(item.message)
        .then(item.resolve)
        .catch(item.reject);
    }
  }

  /**
   * Send a message to Julia
   */
  private async sendMessage(message: any): Promise<JuliaTypes.JuliaResponse> {
    if (!this.isConnected) {
      return new Promise((resolve, reject) => {
        // If not connected, queue the message
        if (this.messageQueue.length >= (this.config.options?.maxQueueSize || 1000)) {
          reject(new Error('Message queue full'));
          return;
        }
        
        this.messageQueue.push({
          message,
          resolve,
          reject,
          timestamp: Date.now()
        });
      });
    }
    
    return new Promise<JuliaTypes.JuliaResponse>((resolve, reject) => {
      try {
        // Generate a unique ID for this request
        const requestId = uuidv4();
        const requestMessage = {
          id: requestId,
          ...message
        };
        
        // Set up timeout
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }, this.config.options?.timeout || 30000);
        
        // Store the promise callbacks
        this.pendingRequests.set(requestId, {
          resolve,
          reject,
          timeout
        });
        
        // Add artificial delay if configured (for testing)
        if (this.config.options?.artificialDelay) {
          setTimeout(() => {
            if (this.ws) {
              this.ws.send(JSON.stringify(requestMessage));
            }
          }, this.config.options.artificialDelay);
        } else {
          if (this.ws) {
            this.ws.send(JSON.stringify(requestMessage));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Run Julia code directly
   */
  async executeCode(code: string, timeout?: number): Promise<JuliaTypes.JuliaResponse> {
    try {
      // Validate message
      const message: JuliaTypes.JuliaExecuteMessage = {
        type: 'execute',
        code,
        timeout
      };
      
      // Send message
      const response = await this.sendMessage(message);
      
      // Validate and return response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to execute code:', error);
      throw error;
    }
  }

  /**
   * Run an optimization algorithm on the Julia server
   */
  async optimize(params: JuliaTypes.OptimizationParams, timeout?: number): Promise<JuliaTypes.JuliaResponse> {
    try {
      // Validate parameters
      const validatedParams = JuliaTypes.OptimizationParamsSchema.parse(params);
      
      // Create message
      const message: JuliaTypes.JuliaOptimizeMessage = {
        type: 'optimize',
        params: validatedParams,
        timeout
      };
      
      // Send message
      const response = await this.sendMessage(message);
      
      // Validate and return response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to run optimization:', error);
      throw error;
    }
  }

  /**
   * Run a query on the Julia server
   */
  async query<T = any>(query: string, params?: any): Promise<JuliaTypes.JuliaResponse<T>> {
    try {
      // Create message
      const message: JuliaTypes.JuliaQueryMessage = {
        type: 'query',
        query,
        params
      };
      
      // Send message
      const response = await this.sendMessage(message);
      
      // Validate and return response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to run query:', error);
      throw error;
    }
  }

  /**
   * Cancel a running task on the Julia server
   */
  async cancelTask(taskId: string): Promise<JuliaTypes.JuliaResponse> {
    try {
      // Create message
      const message: JuliaTypes.JuliaCancelMessage = {
        type: 'cancel',
        taskId
      };
      
      // Send message
      const response = await this.sendMessage(message);
      
      // Validate and return response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to cancel task:', error);
      throw error;
    }
  }

  /**
   * Check the status of the Julia server
   */
  async getStatus(): Promise<JuliaTypes.JuliaResponse> {
    try {
      // Create message
      const message: JuliaTypes.JuliaStatusMessage = {
        type: 'status'
      };
      
      // Send message
      const response = await this.sendMessage(message);
      
      // Validate and return response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Stop the Julia bridge
   */
  async stop(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.juliaProcess) {
      this.juliaProcess.kill();
      this.juliaProcess = null;
    }
    
    // Reject all pending requests
    for (const [id, request] of this.pendingRequests.entries()) {
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      request.reject(new Error('Bridge stopped'));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Parse and validate a response from Julia
   */
  private parseResponse<T = any>(response: any): JuliaTypes.JuliaResponse<T> {
    try {
      const validatedResponse = JuliaTypes.JuliaResponseSchema.parse(response);
      return validatedResponse as JuliaTypes.JuliaResponse<T>;
    } catch (error) {
      throw new Error(`Invalid response format: ${error}`);
    }
  }
} 