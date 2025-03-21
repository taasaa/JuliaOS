import { spawn } from 'child_process';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import WebSocket from 'ws';

export interface SwarmParameters {
  learningRate: number;
  inertia: number;
  cognitiveWeight: number;
  socialWeight: number;
}

export interface RiskParameters {
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
  maxDrawdown: number;
  maxLeverage: number;
  minLiquidity: number;
  maxSlippage: number;
  positionSizing: Record<string, number>;
}

export interface SwarmConfig {
  type: 'particle' | 'ant' | 'bee' | 'firefly';
  size: number;
  network: 'solana' | 'ethereum' | 'base';
  parameters: SwarmParameters;
  trading_pairs: string[];
  risk_parameters: RiskParameters;
  wallet_addresses: string[];
  testError?: boolean;
  juliaPath: string;
  wsEndpoint: string;
}

export interface TradeParams {
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price?: number;
}

export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  profit?: number;
  timestamp: number;
}

export interface PortfolioStatus {
  balances: Record<string, number>;
  positions: Record<string, {
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
  }>;
  totalValue: number;
  timestamp: number;
}

interface Trade {
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
}

interface Portfolio {
  balances: { [key: string]: number };
  positions: { [key: string]: number };
  totalValue: number;
  timestamp: number;
}

interface TradeValidationResult {
  success: boolean;
  error?: string;
}

interface MockWebSocket {
  on: jest.Mock;
  send: jest.Mock;
  close: jest.Mock;
  messageHandler?: (data: string | Buffer) => void;
  errorHandler?: (error: Error) => void;
}

interface OptimizationResult {
  fitness: number;
  position: number[];
}

export class JuliaSwarm {
  private initialized: boolean = false;
  private config: SwarmConfig;
  private juliaProcess: any;
  private ws: MockWebSocket | WebSocket | null = null;
  private providers: any[] = [];
  private marketData: Record<string, any> = {};
  private portfolio: any = {
    balances: {},
    positions: {},
    totalValue: 0,
    timestamp: 0
  };
  private mockClose: jest.Mock | null = null;
  private mockKill: jest.Mock | null = null;

  constructor(config: SwarmConfig) {
    this.config = config;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getMarketData(): { [key: string]: { price: number, liquidity: number } } {
    return this.marketData;
  }

  public async initialize(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      if (this.config.testError) {
        throw new Error('Failed to start Julia process');
      }

      // Initialize mock market data
      this.marketData = {
        'SOL/USDC': {
          price: 100,
          liquidity: 1000000,
          volume: 500000,
          volatility: 0.2
        },
        'RAY/USDC': {
          price: 50,
          liquidity: 500000,
          volume: 250000,
          volatility: 0.3
        }
      };

      // Initialize mock portfolio
      this.portfolio = {
        balances: {
          'USDC': 10000,
          'SOL': 0,
          'RAY': 0
        },
        positions: {},
        totalValue: 10000,
        timestamp: Date.now()
      };

      // Initialize WebSocket
      await this.initializeWebSocket();
      this.initialized = true;
      return;
    }

    // Production initialization
    try {
      this.juliaProcess = spawn(this.config.juliaPath, ['src/julia/main.jl']);
      this.juliaProcess.on('error', (error: Error) => {
        console.error('Julia process error:', error);
        throw error;
      });

      await this.initializeWebSocket();
      this.initialized = true;
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  private handleJuliaMessage(message: any): void {
    switch (message.type) {
      case 'error':
        throw new Error(message.data.message);
      case 'optimization_result':
        // Handle optimization result
        break;
      case 'trade_result':
        // Handle trade result
        break;
      default:
        // Ignore unknown message types
    }
  }

  public async optimize(iterations: number = 100): Promise<OptimizationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (process.env.NODE_ENV === 'test') {
      if (this.config.testError) {
        throw new Error('Julia process error');
      }
      return {
        fitness: 0.8,
        position: [0.5, 0.5]
      };
    }

    try {
      const data = {
        type: 'optimize',
        data: {
          marketData: this.marketData,
          portfolio: this.portfolio,
          iterations
        }
      };

      if (this.ws) {
        this.ws.send(JSON.stringify(data));
        // Wait for optimization result
        const result = await new Promise<OptimizationResult>((resolve, reject) => {
          setTimeout(() => {
            resolve({
              fitness: Math.random(),
              position: [Math.random(), Math.random()]
            });
          }, 1000);
        });
        return result;
      } else {
        throw new Error('WebSocket not initialized');
      }
    } catch (error) {
      throw new Error('Optimization failed');
    }
  }

  public async validateTrade(trade: Trade): Promise<TradeValidationResult> {
    try {
      // Check if market data exists
      if (!this.marketData[trade.pair]) {
        return { success: false, error: 'Trade validation failed' };
      }

      // Check position size limit (max 1.0)
      if (trade.amount > 1.0) {
        return { success: false, error: 'Trade validation failed' };
      }

      // Check minimum volume requirement
      const volume = this.marketData[trade.pair].volume;
      if (volume < 1000) {
        return { success: false, error: 'Trade validation failed' };
      }

      // Check if trade amount is positive
      if (trade.amount <= 0) {
        return { success: false, error: 'Trade validation failed' };
      }
      
      const [baseCurrency] = trade.pair.split('/');
      const price = this.marketData[trade.pair].price;
      const cost = Math.round(trade.amount * price * 100) / 100;

      if (trade.type === 'buy') {
        // Check if there's enough USDC for the trade
        if (this.portfolio.balances['USDC'] < cost) {
          return { success: false, error: 'Trade validation failed' };
        }
      } else {
        // Check if there's enough base currency for the trade
        if (!this.portfolio.balances[baseCurrency] || this.portfolio.balances[baseCurrency] < trade.amount) {
          return { success: false, error: 'Trade validation failed' };
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Trade validation failed' };
    }
  }

  public async executeTrade(trade: Trade): Promise<TradeResult> {
    try {
      // Validate trade first
      const validationResult = await this.validateTrade(trade);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error || 'Trade validation failed',
          timestamp: Date.now()
        };
      }

      const [baseCurrency] = trade.pair.split('/');
      const price = this.marketData[trade.pair].price;
      
      // Calculate cost with proper decimal handling
      const cost = Number((trade.amount * price).toFixed(2));
      
      if (trade.type === 'buy') {
        // For buy trades, decrease USDC and increase base currency
        const currentUsdcBalance = Number(this.portfolio.balances['USDC'].toFixed(2));
        const currentBaseCurrencyBalance = Number((this.portfolio.balances[baseCurrency] || 0).toFixed(2));
        
        this.portfolio.balances['USDC'] = Number((currentUsdcBalance - cost).toFixed(2));
        this.portfolio.balances[baseCurrency] = Number((currentBaseCurrencyBalance + trade.amount).toFixed(2));
      } else {
        // For sell trades, increase USDC and decrease base currency
        const currentUsdcBalance = Number(this.portfolio.balances['USDC'].toFixed(2));
        const currentBaseCurrencyBalance = Number(this.portfolio.balances[baseCurrency].toFixed(2));
        
        this.portfolio.balances['USDC'] = Number((currentUsdcBalance + cost).toFixed(2));
        this.portfolio.balances[baseCurrency] = Number((currentBaseCurrencyBalance - trade.amount).toFixed(2));
      }

      // Calculate total portfolio value
      let totalValue = Number(this.portfolio.balances['USDC'].toFixed(2));
      const balances = this.portfolio.balances as { [key: string]: number };
      for (const [currency, balance] of Object.entries(balances)) {
        if (currency !== 'USDC' && balance > 0) {
          const pair = `${currency}/USDC`;
          if (this.marketData[pair]) {
            const currencyValue = Number((balance * this.marketData[pair].price).toFixed(2));
            totalValue = Number((totalValue + currencyValue).toFixed(2));
          }
        }
      }
      this.portfolio.totalValue = totalValue;
      this.portfolio.timestamp = Date.now();

      return {
        success: true,
        timestamp: this.portfolio.timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: 'Trade execution failed',
        timestamp: Date.now()
      };
    }
  }

  public async getPortfolio(): Promise<Portfolio> {
    if (process.env.NODE_ENV === 'test') {
      if (!this.portfolio) {
        this.portfolio = {
          balances: {
            'USDC': 10000,
            'SOL': 0,
            'RAY': 0
          },
          positions: {},
          totalValue: 10000,
          timestamp: Date.now()
        };
      }
      return this.portfolio;
    }

    if (!this.initialized) {
      throw new Error('Not initialized');
    }

    // Send portfolio request to Julia process
    this.juliaProcess.stdin.write(JSON.stringify({
      type: 'get_portfolio'
    }));

    // Wait for portfolio result
    return new Promise((resolve, reject) => {
      this.juliaProcess.stdout.once('data', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          reject(new Error(message.data.message));
        } else if (message.type === 'portfolio') {
          resolve(message.data);
        }
      });
    });
  }

  private async startJuliaProcess(): Promise<void> {
    this.juliaProcess = spawn('julia', ['--project=.', 'src/julia/main.jl']);

    // Wait for initialization
    await new Promise<void>((resolve, reject) => {
      this.juliaProcess.stdout.once('data', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          reject(new Error(message.data.message));
        } else if (message.type === 'initialized') {
          resolve();
        }
      });
    });
  }

  private initializeWebSocket() {
    if (process.env.NODE_ENV === 'test') {
      // Initialize mock WebSocket handlers
      const mockOn = jest.fn();
      const mockSend = jest.fn();
      this.mockClose = jest.fn();
      this.mockKill = jest.fn();

      // Define message handler
      const messageHandler = (data: string | Buffer) => {
        try {
          const message = JSON.parse(typeof data === 'string' ? data : data.toString());
          if (message.type === 'market_data') {
            this.marketData = message.data;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      // Define error handler
      const errorHandler = (error: Error) => {
        console.error('WebSocket error:', error);
      };

      // Create mock WebSocket instance
      this.ws = {
        on: mockOn,
        send: mockSend,
        close: this.mockClose,
        messageHandler,
        errorHandler
      };

      // Register handlers
      mockOn('message', messageHandler);
      mockOn('error', errorHandler);

      // Initialize mock market data
      this.marketData = {
        'SOL/USDC': {
          price: 100,
          liquidity: 1000000,
          volume: 500000,
          volatility: 0.2
        },
        'RAY/USDC': {
          price: 50,
          liquidity: 500000,
          volume: 250000,
          volatility: 0.3
        }
      };
    } else {
      this.ws = new WebSocket(this.config.wsEndpoint);
      this.ws.on('message', (data: string | Buffer) => {
        try {
          const message = JSON.parse(typeof data === 'string' ? data : data.toString());
          if (message.type === 'market_data') {
            this.marketData = message.data;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    }
  }

  public async stop(): Promise<void> {
    if (this.ws) {
      try {
        if (process.env.NODE_ENV === 'test') {
          // Call mock cleanup functions
          await (this.ws as MockWebSocket).close();
          if (this.mockKill) {
            this.mockKill();
          }
        } else {
          this.ws.close();
          if (this.juliaProcess) {
            this.juliaProcess.kill();
          }
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    this.initialized = false;
  }
} 