import { ethers } from 'ethers';
import * as path from 'path';
import { SwarmAgent } from '../../packages/core/src/agents/SwarmAgent';
import { DeFiTradingSkill } from '../../packages/core/src/skills/DeFiTradingSkill';
import { JuliaBridge } from '../../packages/core/src/bridge/JuliaBridge';
import * as JuliaTypes from '../../packages/core/src/types/JuliaTypes';

describe('Cross-Chain Julia Swarm Trading Integration', () => {
  let juliaBridge: JuliaBridge;
  let swarmAgent: SwarmAgent;
  let tradingSkill: DeFiTradingSkill;
  let ethereumProvider: ethers.JsonRpcProvider;
  let solanaProvider: any; // Will be initialized based on environment
  
  const supportedChains = ['ethereum', 'solana', 'base'];
  const tradingPairs = ['ETH/USDC', 'SOL/USDC', 'BTC/USDC', 'ARB/USDC'];
  
  beforeAll(async () => {
    // Initialize providers based on environment variables
    ethereumProvider = new ethers.JsonRpcProvider(
      process.env.ETH_RPC_URL || 'http://localhost:8545'
    );
    
    // Initialize JuliaBridge with better error handling
    try {
      juliaBridge = new JuliaBridge({
        juliaPath: process.env.JULIA_PATH || 'julia',
        scriptPath: path.join(__dirname, '../../julia/src'),
        port: 8000,
        options: {
          debug: process.env.DEBUG === 'true',
          timeout: 60000, // Increased timeout for complex operations
          maxRetries: 3,
          reconnectInterval: 5000,
          backoffMultiplier: 1.5
        }
      });
      
      await juliaBridge.initialize();
      console.log('JuliaBridge initialized successfully');
    } catch (error) {
      console.error('Failed to initialize JuliaBridge:', error);
      throw error;
    }
    
    // Initialize SwarmAgent
    swarmAgent = new SwarmAgent({
      name: 'cross-chain-swarm',
      type: 'trading',
      platforms: supportedChains,
      skills: [],
      swarmConfig: {
        size: 15, // Increased swarm size for cross-chain operations
        communicationProtocol: 'gossip',
        consensusThreshold: 0.75,
        updateInterval: 3000
      }
    });
    
    await swarmAgent.initialize();
    
    // Initialize DeFiTradingSkill with cross-chain configuration
    tradingSkill = new DeFiTradingSkill(swarmAgent, {
      tradingPairs: tradingPairs,
      swarmSize: 15,
      algorithm: 'pso',
      riskParameters: {
        maxPositionSize: 2.0,
        stopLoss: 0.03,
        takeProfit: 0.07,
        maxDrawdown: 0.12
      },
      provider: process.env.ETH_RPC_URL || 'http://localhost:8545',
      wallet: process.env.PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    });
    
    await tradingSkill.initialize();
  });
  
  afterAll(async () => {
    // Clean up resources
    await tradingSkill.stop();
    await swarmAgent.stop();
    await juliaBridge.stop();
  });
  
  test('should connect to multiple chains', async () => {
    // Access platforms from BaseAgent (it's a protected property)
    // Using type assertion to access protected property
    const agent = swarmAgent as any;
    expect(agent.platforms).toContain('ethereum');
    
    // With proper environment variables, this would check for actual chains
    expect(agent.platforms.length).toBeGreaterThan(0);
  });
  
  test('should initialize Julia swarm optimization', async () => {
    // Define optimization parameters for the PSO algorithm with correct typing
    // Based on the actual definition in JuliaTypes.ts
    const optimizationParams: JuliaTypes.OptimizationParams = {
      algorithm: 'pso' as JuliaTypes.OptimizationAlgorithm,
      objectiveFunction: 'maximize_sharpe_ratio',
      dimensions: tradingPairs.length * 2, // Parameters per trading pair
      populationSize: 20,
      iterations: 50,
      inertiaWeight: 0.7,
      cognitiveWeight: 1.5,
      socialWeight: 1.5,
      bounds: {
        min: Array(tradingPairs.length * 2).fill(0),
        max: Array(tradingPairs.length * 2).fill(1)
      }
    };
    
    // Execute Julia optimization
    const result = await juliaBridge.optimize(optimizationParams);
    
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.position).toBeDefined();
    expect(Array.isArray(result.data.position)).toBe(true);
    expect(result.data.position.length).toBe(tradingPairs.length * 2);
    expect(result.data.fitness).toBeGreaterThan(0);
  });
  
  test('should execute cross-chain market data fetching', async () => {
    // Setup test spy on trading skill
    const fetchMarketDataSpy = jest.spyOn(tradingSkill as any, 'fetchMarketData');
    
    // Execute market data fetching for different chains
    for (const pair of tradingPairs) {
      const marketData = await tradingSkill['fetchMarketData'](pair);
      
      expect(marketData).toBeDefined();
      expect(marketData.symbol).toBe(pair);
      expect(marketData.price).toBeGreaterThan(0);
      expect(marketData.metrics).toBeDefined();
    }
    
    // Verify all pairs were fetched
    expect(fetchMarketDataSpy).toHaveBeenCalledTimes(tradingPairs.length);
    fetchMarketDataSpy.mockRestore();
  });
  
  test('should execute cross-chain arbitrage detection', async () => {
    // This test requires Julia bridge to be working
    const arbitrageCode = `
      # Load packages
      using Statistics
      using JSON
      
      # Define test market data
      market_data = Dict(
        "ETH/USDC" => Dict("price" => 3500.0, "chain" => "ethereum"),
        "ETH/USDC" => Dict("price" => 3505.0, "chain" => "base"),
        "SOL/USDC" => Dict("price" => 145.0, "chain" => "solana"),
        "SOL/USDC" => Dict("price" => 146.5, "chain" => "ethereum")
      )
      
      # Calculate arbitrage opportunities
      function find_arbitrage(market_data)
        opportunities = []
        
        # Group by token pair
        pairs = unique([k for (k, v) in market_data])
        
        for pair in pairs
          # Get all prices for this pair across chains
          pair_data = Dict(chain => data["price"] for (p, data) in market_data if p == pair for chain in [data["chain"]])
          
          # Need at least 2 chains to compare
          if length(pair_data) >= 2
            chains = collect(keys(pair_data))
            prices = collect(values(pair_data))
            
            # Find min and max prices
            min_price = minimum(prices)
            max_price = maximum(prices)
            
            min_chain = chains[argmin(prices)]
            max_chain = chains[argmax(prices)]
            
            # Calculate spread
            spread_pct = (max_price - min_price) / min_price * 100
            
            # If spread is significant
            if spread_pct > 0.5  # 0.5% threshold
              push!(opportunities, Dict(
                "pair" => pair,
                "buy_chain" => min_chain,
                "sell_chain" => max_chain,
                "buy_price" => min_price,
                "sell_price" => max_price,
                "spread_pct" => spread_pct
              ))
            end
          end
        end
        
        return opportunities
      end
      
      # Return results
      find_arbitrage(market_data)
    `;
    
    const result = await juliaBridge.executeCode(arbitrageCode);
    
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  test('should calculate optimal position sizing using Julia', async () => {
    const positionSizingCode = `
      # Load required packages
      using Statistics
      using Random
      using Distributions
      using JSON
      
      # Define risk parameters
      max_position_size = 2.0
      max_portfolio_risk = 0.1  # 10% portfolio risk
      
      # Define asset parameters (from market data)
      assets = [
        Dict("symbol" => "ETH/USDC", "volatility" => 0.08, "correlation" => [1.0, 0.7, 0.5, 0.3]),
        Dict("symbol" => "SOL/USDC", "volatility" => 0.12, "correlation" => [0.7, 1.0, 0.4, 0.2]),
        Dict("symbol" => "BTC/USDC", "volatility" => 0.07, "correlation" => [0.5, 0.4, 1.0, 0.6]),
        Dict("symbol" => "ARB/USDC", "volatility" => 0.14, "correlation" => [0.3, 0.2, 0.6, 1.0])
      ]
      
      # Calculate optimal position sizes based on Kelly criterion with correlation
      function kelly_position_sizing(assets, max_risk, max_position)
        n = length(assets)
        position_sizes = zeros(n)
        
        # Simple Kelly calculation for each asset
        for i in 1:n
          # Expected excess return (simplified)
          excess_return = 0.1  # 10% expected return
          
          # Kelly fraction
          kelly = excess_return / (assets[i]["volatility"]^2)
          
          # Apply maximum position constraint
          position_sizes[i] = min(kelly * max_risk, max_position)
        end
        
        # Apply correlation adjustment (simplified)
        for i in 1:n
          correlation_factor = 0.0
          for j in 1:n
            if i != j
              correlation_factor += assets[i]["correlation"][j] * position_sizes[j]
            end
          end
          position_sizes[i] *= (1.0 - 0.5 * correlation_factor / n)
        end
        
        # Ensure positive sizes
        position_sizes = max.(position_sizes, 0.0)
        
        # Create result dictionary mapping symbols to position sizes
        result = Dict(assets[i]["symbol"] => position_sizes[i] for i in 1:n)
        
        return result
      end
      
      # Run position sizing
      kelly_position_sizing(assets, max_portfolio_risk, max_position_size)
    `;
    
    const result = await juliaBridge.executeCode(positionSizingCode);
    
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data).toBeInstanceOf(Object);
    
    // Check that position sizes are calculated for all trading pairs
    for (const pair of tradingPairs) {
      expect(result.data).toHaveProperty(pair);
      expect(typeof result.data[pair]).toBe('number');
      expect(result.data[pair]).toBeGreaterThanOrEqual(0);
      expect(result.data[pair]).toBeLessThanOrEqual(2.0); // max position size
    }
  });
  
  test('should send real-time market data to Julia for processing', async () => {
    // Test market data streaming to Julia
    const streamCode = `
      # Initialize storage for streaming data
      if !@isdefined(market_data_buffer)
        market_data_buffer = Dict()
      end
      
      # Process incoming market data
      function process_market_data(data)
        # Store in buffer
        symbol = data["symbol"]
        if !haskey(market_data_buffer, symbol)
          market_data_buffer[symbol] = []
        end
        push!(market_data_buffer[symbol], data)
        
        # Keep only last 100 data points
        if length(market_data_buffer[symbol]) > 100
          market_data_buffer[symbol] = market_data_buffer[symbol][end-99:end]
        end
        
        return Dict(
          "status" => "received",
          "symbol" => symbol,
          "count" => length(market_data_buffer[symbol])
        )
      end
      
      # Process the data
      process_market_data($(JSON.json(market_data_input)))
    `;
    
    // Send market data for multiple pairs
    for (const pair of tradingPairs) {
      const marketData = await tradingSkill['fetchMarketData'](pair);
      
      const result = await juliaBridge.executeCode(
        streamCode.replace('market_data_input', JSON.stringify(marketData))
      );
      
      expect(result).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.data.status).toBe('received');
      expect(result.data.symbol).toBe(pair);
    }
  });
}); 