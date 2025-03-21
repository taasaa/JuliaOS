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

describe('JuliaSwarm', () => {
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

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await swarm.initialize();
      expect(swarm.isInitialized()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const errorConfig = { ...config, testError: true };
      const errorSwarm = new JuliaSwarm(errorConfig);
      await expect(errorSwarm.initialize()).rejects.toThrow('Failed to start Julia process');
    });
  });

  describe('optimization', () => {
    it('should optimize successfully', async () => {
      await swarm.initialize();
      const result = await swarm.optimize();
      expect(result).toEqual({
        position: [0.5, 0.5],
        fitness: 0.8
      });
    });

    it('should handle optimization errors gracefully', async () => {
      await swarm.initialize();
      const errorConfig = { ...config, testError: true };
      const errorSwarm = new JuliaSwarm(errorConfig);
      await errorSwarm.initialize();
      await expect(errorSwarm.optimize()).rejects.toThrow('Julia process error');
    });
  });

  describe('trading', () => {
    beforeEach(async () => {
      await swarm.initialize();
    });

    it('should execute trades successfully', async () => {
      const tradeResult = await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });

      expect(tradeResult.success).toBe(true);
    });

    it('should reject trades exceeding position size limit', async () => {
      const tradeResult = await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 2.0 // Exceeds maxPositionSize
      });

      expect(tradeResult.success).toBe(false);
      expect(tradeResult.error).toBe('Trade validation failed');
    });

    it('should validate liquidity requirements', async () => {
      const errorConfig = { ...config, testError: true };
      const errorSwarm = new JuliaSwarm(errorConfig);
      await errorSwarm.initialize();

      const tradeResult = await errorSwarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });

      expect(tradeResult.success).toBe(false);
      expect(tradeResult.error).toBe('Trade validation failed');
    });
  });

  describe('portfolio management', () => {
    beforeEach(async () => {
      await swarm.initialize();
    });

    it('should update portfolio after trades', async () => {
      // Execute a trade
      await swarm.executeTrade({
        pair: 'SOL/USDC',
        type: 'buy',
        amount: 0.1
      });

      const portfolio = await swarm.getPortfolio();

      // Check balances
      expect(portfolio.balances['SOL']).toBe(0.1);
      expect(portfolio.balances['USDC']).toBe(9900); // 10000 - (0.1 * 100)
      
      // Check total value
      expect(portfolio.totalValue).toBe(10000); // Should remain constant
    });

    it('should handle portfolio request errors', async () => {
      const errorConfig = { ...config, testError: true };
      const errorSwarm = new JuliaSwarm(errorConfig);
      await errorSwarm.initialize();
      await expect(errorSwarm.getPortfolio()).rejects.toThrow('Failed to get portfolio');
    });
  });

  describe('WebSocket functionality', () => {
    beforeEach(async () => {
      await swarm.initialize();
    });

    it('should initialize WebSocket connection', async () => {
      expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle WebSocket messages', async () => {
      expect(mockWs.messageHandler).toBeDefined();
      
      if (mockWs.messageHandler) {
        mockWs.messageHandler(JSON.stringify({
          type: 'market_update',
          data: {
            pair: 'SOL/USDC',
            price: 110,
            liquidity: 1100000
          }
        }));

        expect(swarm.getMarketData()['SOL/USDC'].price).toBe(110);
        expect(swarm.getMarketData()['SOL/USDC'].liquidity).toBe(1100000);
      }
    });

    it('should handle WebSocket errors', async () => {
      expect(mockWs.errorHandler).toBeDefined();
      
      if (mockWs.errorHandler) {
        mockWs.errorHandler(new Error('WebSocket connection failed'));
      }
    });
  });

  describe('cleanup', () => {
    it('should clean up resources properly', async () => {
      await swarm.stop();
      expect(mockClose).toHaveBeenCalled();
      expect(mockKill).toHaveBeenCalled();
      expect(swarm.isInitialized()).toBe(false);
    });
  });
}); 