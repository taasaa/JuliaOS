import { JuliaSwarm } from '../index';
import { SwarmConfig } from '../index';

// Mock environment variables
process.env.ETH_RPC_URL = 'https://eth-mainnet.example.com';
process.env.BASE_RPC_URL = 'https://base-mainnet.example.com';

// Mock WebSocket
const mockOn = jest.fn();
const mockClose = jest.fn();

interface MockWebSocket {
  on: jest.Mock;
  close: jest.Mock;
  messageHandler?: (data: string) => void;
  errorHandler?: (error: Error) => void;
}

const mockWs: MockWebSocket = {
  on: mockOn,
  close: mockClose
};

jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => mockWs);
});

// Mock child_process.spawn
const mockWrite = jest.fn();
const mockEnd = jest.fn();
const mockStdoutOn = jest.fn();
const mockStdoutOnce = jest.fn();
const mockStderrOn = jest.fn();
const mockStderrOnce = jest.fn();
const mockKill = jest.fn();

const mockProcess = {
  stdin: {
    write: mockWrite,
    end: mockEnd
  },
  stdout: {
    on: mockStdoutOn,
    once: mockStdoutOnce
  },
  stderr: {
    on: mockStderrOn,
    once: mockStderrOnce
  },
  kill: mockKill
};

jest.mock('child_process', () => ({
  spawn: jest.fn().mockImplementation(() => mockProcess)
}));

// Mock ethers
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    // Add mock methods as needed
  }))
}));

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    // Add mock methods as needed
  })),
  PublicKey: jest.fn()
}));

// Mock @solana/spl-token
jest.mock('@solana/spl-token', () => ({
  // Add mock methods as needed
}));

describe('JuliaSwarm Integration', () => {
  let swarm: JuliaSwarm;
  let mockWs: any;
  let mockOn: jest.Mock;
  let mockClose: jest.Mock;
  let mockKill: jest.Mock;
  const config: SwarmConfig = {
    type: 'particle',
    size: 10,
    network: 'solana',
    parameters: {
      learningRate: 0.1,
      inertia: 0.5,
      cognitiveWeight: 1.5,
      socialWeight: 1.5
    },
    trading_pairs: ['SOL/USDC', 'RAY/USDC'],
    risk_parameters: {
      maxPositionSize: 0.1,
      minLiquidity: 1000,
      stopLoss: 5.0,
      takeProfit: 10.0,
      maxDrawdown: 20.0,
      maxLeverage: 2.0,
      maxSlippage: 1.0,
      positionSizing: {
        'SOL/USDC': 0.5,
        'RAY/USDC': 0.5
      }
    },
    wallet_addresses: ['test_wallet'],
    testError: false,
    juliaPath: '/usr/local/bin/julia',
    wsEndpoint: 'ws://localhost:8080'
  };

  beforeEach(async () => {
    mockOn = jest.fn();
    mockClose = jest.fn();
    mockKill = jest.fn();

    mockWs = {
      on: mockOn,
      close: mockClose,
      send: jest.fn(),
      messageHandler: undefined,
      errorHandler: undefined
    };

    // Mock WebSocket constructor
    (global as any).WebSocket = jest.fn().mockImplementation(() => mockWs);

    // Mock Julia process
    (global as any).process.kill = mockKill;

    swarm = new JuliaSwarm(config);
    await swarm.initialize();
  });

  afterEach(async () => {
    await swarm.stop();
    jest.clearAllMocks();
  });

  describe('full trading cycle', () => {
    beforeEach(async () => {
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({ type: 'initialized' })));
        }
      });
      await swarm.initialize();
    });

    it('should complete a full trading cycle', async () => {
      // Run optimization
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'optimization_result',
            data: {
              position: [0.5, 0.5],
              fitness: 0.8
            }
          })));
        }
      });

      const optimizationResult = await swarm.optimize(10);
      expect(optimizationResult).toHaveProperty('position');
      expect(optimizationResult).toHaveProperty('fitness');

      // Execute trade
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'trade_result',
            data: {
              success: true,
              timestamp: Date.now()
            }
          })));
        }
      });

      const tradeResult = await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });
      expect(tradeResult).toHaveProperty('success');
      expect(tradeResult).toHaveProperty('timestamp');

      // Check portfolio
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'portfolio',
            data: {
              balances: {
                'USDC': 9900,
                'SOL': 0.1,
                'RAY': 0
              },
              positions: {},
              totalValue: 10000,
              timestamp: Date.now()
            }
          })));
        }
      });

      const portfolio = await swarm.getPortfolio();
      expect(portfolio).toHaveProperty('balances');
      expect(portfolio).toHaveProperty('positions');
      expect(portfolio).toHaveProperty('totalValue');

      // Stop swarm
      await swarm.stop();
      expect(swarm.isInitialized()).toBe(false);
    });

    it('should handle multiple trades across different pairs', async () => {
      // Buy SOL
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'trade_result',
            data: {
              success: true,
              timestamp: Date.now()
            }
          })));
        }
      });

      const solTrade = await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });
      expect(solTrade.success).toBe(true);

      // Buy RAY
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'trade_result',
            data: {
              success: true,
              timestamp: Date.now()
            }
          })));
        }
      });

      const rayTrade = await swarm.executeTrade({
        pair: 'RAY/USDC',
        type: 'buy',
        amount: 0.2
      });
      expect(rayTrade.success).toBe(true);

      // Check portfolio
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'portfolio',
            data: {
              balances: {
                'USDC': 9900,
                'SOL': 0.1,
                'RAY': 0.2
              },
              positions: {},
              totalValue: 10000,
              timestamp: Date.now()
            }
          })));
        }
      });

      const portfolio = await swarm.getPortfolio();
      expect(portfolio.balances['SOL']).toBe(0.1);
      expect(portfolio.balances['RAY']).toBe(0.2);
      expect(portfolio.balances['USDC']).toBe(9900); // 10000 - (0.1 * 100) - (0.2 * 50)
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({ type: 'initialized' })));
        }
      });
      await swarm.initialize();
    });

    it('should handle Julia process errors', async () => {
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'error',
            data: { message: 'Julia process error' }
          })));
        }
      });

      await expect(swarm.optimize()).rejects.toThrow('Julia process error');
    });

    it('should handle WebSocket errors', async () => {
      expect(mockWs.errorHandler).toBeDefined();
      
      if (mockWs.errorHandler) {
        mockWs.errorHandler(new Error('WebSocket connection failed'));
      }
      expect(swarm.isInitialized()).toBe(true);
    });
  });

  describe('market data handling', () => {
    beforeEach(async () => {
      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({ type: 'initialized' })));
        }
      });
      await swarm.initialize();
    });

    it('should update market data through WebSocket', async () => {
      expect(mockWs.messageHandler).toBeDefined();
      
      if (mockWs.messageHandler) {
        mockWs.messageHandler(JSON.stringify({
          type: 'market_update',
          data: {
            pair: 'SOL/USDC',
            price: 101,
            liquidity: 1000001,
            volume: 501000,
            volatility: 0.21
          }
        }));
      }

      const marketData = (swarm as any).marketData['SOL/USDC'];
      expect(marketData.price).toBe(101);
      expect(marketData.liquidity).toBe(1000001);
      expect(marketData.volume).toBe(501000);
      expect(marketData.volatility).toBe(0.21);
    });

    it('should validate trades against market conditions', async () => {
      // Mock low liquidity
      (swarm as any).marketData['SOL/USDC'].liquidity = 50000; // Below minLiquidity

      mockStdoutOnce.mockImplementationOnce((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            type: 'trade_result',
            data: {
              success: false,
              error: 'Trade validation failed'
            }
          })));
        }
      });

      const tradeResult = await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });

      expect(tradeResult.success).toBe(false);
      expect(tradeResult.error).toBe('Trade validation failed');
    });
  });
}); 