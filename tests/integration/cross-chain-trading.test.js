const { expect } = require('chai');
const { ethers } = require('ethers');
const { JuliaBridge } = require('../../packages/julia-bridge/src/JuliaBridge');
const { MarketDataService } = require('../../packages/protocols/src/dex/market-data');
const { TradingService } = require('../../packages/protocols/src/dex/trading');
const { CrossChainAgent } = require('../../packages/protocols/src/dex/agents/cross-chain-agent');

describe('Cross-Chain Trading Integration Tests', function() {
  // These tests may take time to run
  this.timeout(30000);
  
  let juliaBridge;
  let marketData;
  let tradingService;
  let crossChainAgent;
  let mockEthereumProvider;
  let mockSolanaProvider;
  
  before(async () => {
    // Setup mock providers
    mockEthereumProvider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Initialize Julia Bridge
    juliaBridge = new JuliaBridge({
      autoReconnect: true,
      juliaPath: process.env.JULIA_PATH || 'julia'
    });
    
    try {
      await juliaBridge.initialize();
    } catch (error) {
      console.warn('Julia bridge initialization failed, some tests will be skipped:', error.message);
    }
    
    // Initialize market data service
    const marketDataConfig = {
      updateInterval: 5000,
      minConfidence: 0.95,
      maxStaleTime: 3600
    };
    marketData = new MarketDataService(mockEthereumProvider, marketDataConfig);
    await marketData.initialize();
    
    // Initialize trading service
    const tradingConfig = {
      slippageTolerance: 0.005,
      maxFeePerGas: ethers.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
    };
    tradingService = new TradingService(mockEthereumProvider, marketData, {}, tradingConfig);
    
    // Setup cross-chain agent
    const crossChainAgentConfig = {
      name: 'test-cross-chain-agent',
      strategy: 'arbitrage',
      chains: ['ethereum', 'solana'],
      maxPositionSize: '1.0',
      maxTotalExposure: '10.0',
      stopLoss: 5,
      takeProfit: 10,
      leverage: 1
    };
    
    const mockCrossChainService = {
      executeCrossChainTrade: async () => ({ 
        success: true, 
        txHash: 'mock_tx_hash',
        fromChain: 'ethereum',
        toChain: 'solana',
        amount: '1.0',
        fee: '0.01',
        timestamp: Date.now()
      })
    };
    
    crossChainAgent = new CrossChainAgent(
      crossChainAgentConfig,
      mockCrossChainService,
      marketData
    );
  });
  
  after(async () => {
    // Cleanup
    if (juliaBridge && juliaBridge.isInitialized) {
      await juliaBridge.shutdown();
    }
  });
  
  describe('Market Data Service', () => {
    it('should retrieve price data for assets', async () => {
      // Mock token
      const ETH_TOKEN = {
        symbol: 'ETH',
        name: 'Ethereum',
        address: 'eth_address',
        decimals: 18,
        chainId: 1
      };
      
      // Get market data
      const ethMarketData = await marketData.getMarketData(ETH_TOKEN);
      
      expect(ethMarketData).to.have.property('price');
      expect(ethMarketData.price).to.be.a('number');
      expect(ethMarketData).to.have.property('timestamp');
    });
    
    it('should handle multiple market data sources', async () => {
      const sources = marketData.getDataSources();
      expect(sources).to.be.an('array');
    });
  });
  
  describe('Trading Service', () => {
    it('should calculate trade parameters correctly', async () => {
      const tradeParams = tradingService.calculateTradeParameters({
        tokenIn: 'ETH',
        tokenOut: 'USDC',
        amountIn: '1.0',
        slippage: 0.5 // 0.5%
      });
      
      expect(tradeParams).to.have.property('amountIn');
      expect(tradeParams).to.have.property('minAmountOut');
      expect(tradeParams).to.have.property('deadline');
    });
    
    it('should estimate gas costs for trades', async () => {
      const gasCost = await tradingService.estimateGasCost({
        tokenIn: 'ETH',
        tokenOut: 'USDC',
        amountIn: '1.0',
      });
      
      expect(gasCost).to.have.property('gasCost');
      expect(gasCost).to.have.property('gasInEth');
      expect(gasCost).to.have.property('gasInUsd');
    });
  });
  
  describe('Cross-Chain Agent', () => {
    it('should analyze trading opportunities', async () => {
      // Mock market data for testing arbitrage detection
      const mockEthPrice = 3000;
      const mockSolPrice = 100;
      
      // Mock market data response
      marketData.getMarketData = async (token) => {
        if (token.symbol === 'ETH') {
          return {
            price: mockEthPrice,
            volume: 1000000,
            liquidity: 5000000,
            timestamp: Date.now()
          };
        } else if (token.symbol === 'SOL') {
          return {
            price: mockSolPrice,
            volume: 2000000,
            liquidity: 3000000,
            timestamp: Date.now()
          };
        }
      };
      
      // Test opportunity detection
      const opportunities = await crossChainAgent.analyzeOpportunities();
      
      expect(opportunities).to.be.an('array');
      // Further assertions on opportunity structure
    });
    
    it('should execute cross-chain trades', async () => {
      // Mock trade execution
      const result = await crossChainAgent.executeTrade({
        tokenPair: 'ETH/USDC',
        amount: '1.0',
        type: 'buy',
        chain: 'ethereum'
      });
      
      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
    });
    
    it('should manage positions across chains', async () => {
      // Add mock position
      await crossChainAgent.addPosition({
        chain: 'ethereum',
        tokenPair: 'ETH/USDC',
        amount: '2.0',
        entryPrice: 3000,
        timestamp: Date.now()
      });
      
      // Get positions
      const positions = crossChainAgent.getPositions();
      
      expect(positions).to.have.property('ethereum');
      expect(positions.ethereum).to.be.an('array');
      expect(positions.ethereum[0]).to.have.property('tokenPair', 'ETH/USDC');
    });
  });
  
  // Only run Julia integration tests if bridge is available
  (juliaBridge && juliaBridge.isInitialized ? describe : describe.skip)('Julia Swarm Optimization', () => {
    let swarmId;
    
    it('should start a swarm', async () => {
      const swarmConfig = {
        size: 20,
        algorithm: 'pso',
        parameters: {
          maxPositionSize: 1.0,
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20,
          inertia: 0.7,
          cognitiveWeight: 1.5,
          socialWeight: 1.5
        }
      };
      
      swarmId = await juliaBridge.startSwarm(swarmConfig);
      expect(swarmId).to.be.a('string');
    });
    
    it('should optimize trading parameters', async () => {
      if (!swarmId) {
        this.skip();
      }
      
      // Create market data for optimization
      const marketData = [];
      
      // Add mock historical data points
      for (let i = 0; i < 10; i++) {
        marketData.push({
          symbol: 'ETH/USDC',
          price: 3000 + (Math.random() * 200 - 100),
          volume: 1000000 + (Math.random() * 500000),
          timestamp: new Date(Date.now() - (i * 3600 * 1000)),
          indicators: {
            sma_20: 3050,
            rsi: 45 + (Math.random() * 20),
            macd: 10 + (Math.random() * 5 - 2.5),
            bb_upper: 3100,
            bb_middle: 3000,
            bb_lower: 2900
          }
        });
      }
      
      // Run optimization
      const result = await juliaBridge.optimizeSwarm({
        swarmId,
        marketData,
        tradingPairs: ['ETH/USDC'],
        riskParameters: {
          maxPositionSize: 1.0,
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20
        }
      });
      
      expect(result).to.have.property('action');
      expect(['buy', 'sell', 'hold']).to.include(result.action);
      expect(result).to.have.property('amount');
      expect(result).to.have.property('confidence');
      expect(result).to.have.property('reasoning');
    });
    
    it('should stop the swarm', async () => {
      if (!swarmId) {
        this.skip();
      }
      
      await juliaBridge.stopSwarm(swarmId);
      
      // Verify swarm is stopped
      const activeSwarms = await juliaBridge.getActiveSwarms();
      expect(activeSwarms).to.not.include(swarmId);
    });
  });
}); 