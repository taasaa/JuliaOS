import * as path from 'path';
import { ethers } from 'ethers';
import { CrossChainJuliaBridge, CrossChainConfig } from '../../packages/core/src/bridge/CrossChainJuliaBridge';
import { JuliaBridgeConfig } from '../../packages/core/src/bridge/JuliaBridge';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting Cross Chain Trading Example with Julia Optimization');
  
  try {
    // Configure Julia Bridge
    const bridgeConfig: JuliaBridgeConfig = {
      juliaPath: process.env.JULIA_PATH || 'julia',
      scriptPath: path.join(__dirname, '../../julia/src'),
      port: 8000,
      options: {
        debug: process.env.DEBUG === 'true',
        timeout: 60000,
        maxRetries: 3
      }
    };
    
    // Configure cross-chain settings
    const crossChainConfig: CrossChainConfig = {
      supportedChains: ['ethereum', 'solana', 'base'],
      tradingPairs: ['ETH/USDC', 'SOL/USDC', 'BTC/USDC'],
      bridgeFees: {
        'ethereum_solana': 0.005, // 0.5%
        'solana_ethereum': 0.006,
        'ethereum_base': 0.002,
        'base_ethereum': 0.002,
        'solana_base': 0.007,
        'base_solana': 0.007
      },
      maxSlippage: 0.01, // 1%
      minLiquidity: {
        'ethereum': 100000,
        'solana': 50000,
        'base': 20000
      }
    };
    
    // Initialize bridge
    const bridge = new CrossChainJuliaBridge(bridgeConfig, crossChainConfig);
    console.log('Initializing Julia Bridge...');
    await bridge.initialize();
    console.log('Julia Bridge initialized successfully');
    
    // Set up mock market data for demonstration
    await populateMockMarketData(bridge);
    
    // Update gas prices 
    bridge.updateGasPrice('ethereum', 25); // in gwei
    bridge.updateGasPrice('solana', 0.000001);
    bridge.updateGasPrice('base', 0.1);
    
    // Update token balances
    bridge.updateTokenBalance('ethereum', 'ETH', 1.0);
    bridge.updateTokenBalance('ethereum', 'USDC', 1000);
    bridge.updateTokenBalance('solana', 'SOL', 20);
    bridge.updateTokenBalance('solana', 'USDC', 1500);
    bridge.updateTokenBalance('base', 'ETH', 0.5);
    bridge.updateTokenBalance('base', 'USDC', 500);
    
    // Find arbitrage opportunities
    console.log('\nSearching for arbitrage opportunities...');
    const arbitrageOpportunities = await bridge.findArbitrageOpportunities();
    
    if (arbitrageOpportunities.length > 0) {
      console.log('Found arbitrage opportunities:');
      arbitrageOpportunities.forEach((opportunity, index) => {
        console.log(`\nOpportunity ${index + 1}:`);
        console.log(`  Pair: ${opportunity.pair}`);
        console.log(`  Buy on: ${opportunity.buy_chain} at ${opportunity.buy_price}`);
        console.log(`  Sell on: ${opportunity.sell_chain} at ${opportunity.sell_price}`);
        console.log(`  Spread: ${opportunity.spread_pct.toFixed(2)}%`);
        console.log(`  Estimated profit: ${opportunity.estimated_profit_pct.toFixed(2)}%`);
      });
    } else {
      console.log('No arbitrage opportunities found above threshold');
    }
    
    // Optimize portfolio allocation
    console.log('\nOptimizing portfolio allocation...');
    const portfolioWeights = await bridge.optimizePortfolio({
      maxRisk: 0.2,  // 20% max risk
      targetReturn: 0.1,  // 10% target return
      maxDrawdown: 0.15  // 15% max drawdown
    });
    
    console.log('Optimized portfolio weights:');
    for (const [pair, weight] of Object.entries(portfolioWeights)) {
      if (pair !== '_metrics') {
        console.log(`  ${pair}: ${(Number(weight) * 100).toFixed(2)}%`);
      }
    }
    
    // Get portfolio metrics
    if (portfolioWeights._metrics) {
      console.log('\nPortfolio metrics:');
      console.log(`  Expected return: ${(portfolioWeights._metrics.expected_return * 100).toFixed(2)}%`);
      console.log(`  Expected risk: ${(portfolioWeights._metrics.expected_risk * 100).toFixed(2)}%`);
      console.log(`  Sharpe ratio: ${portfolioWeights._metrics.sharpe_ratio.toFixed(4)}`);
    }
    
    // Find optimal execution path for ETH/USDC to BTC/USDC
    console.log('\nFinding optimal execution path from ETH/USDC to BTC/USDC...');
    const execPaths = await bridge.findOptimalExecutionPath('ETH/USDC', 'BTC/USDC', 1.0);
    
    if (execPaths.length > 0) {
      // Get the best path (first result)
      const bestPath = execPaths[0];
      console.log('Best execution path:');
      console.log(`  Type: ${bestPath.type}`);
      
      if (bestPath.type === 'direct') {
        console.log(`  Chain: ${bestPath.chain}`);
        console.log(`  Input: ${bestPath.input_amount} ${bestPath.source_pair.split('/')[0]}`);
        console.log(`  Output: ${bestPath.output_amount.toFixed(6)} ${bestPath.target_pair.split('/')[0]}`);
        console.log(`  Execution cost: $${bestPath.execution_cost.toFixed(2)}`);
      } else {
        console.log(`  Source chain: ${bestPath.source_chain}`);
        console.log(`  Target chain: ${bestPath.target_chain}`);
        console.log(`  Input: ${bestPath.input_amount} ${bestPath.source_pair.split('/')[0]}`);
        console.log(`  Output: ${bestPath.output_amount.toFixed(6)} ${bestPath.target_pair.split('/')[0]}`);
        console.log(`  Bridge fee: $${bestPath.bridge_fee.toFixed(2)}`);
        console.log(`  Total execution cost: $${bestPath.execution_cost.toFixed(2)}`);
      }
      
      // Show other paths if available
      if (execPaths.length > 1) {
        console.log('\nAlternative execution paths:');
        for (let i = 1; i < Math.min(execPaths.length, 3); i++) {
          const path = execPaths[i];
          console.log(`\nPath ${i + 1}:`);
          console.log(`  Type: ${path.type}`);
          console.log(`  Output amount: ${path.output_amount.toFixed(6)} ${path.target_pair.split('/')[0]}`);
          console.log(`  Efficiency: ${(path.output_per_cost * 100).toFixed(2)}%`);
        }
      }
    } else {
      console.log('No execution paths found');
    }
    
    // Calculate optimal allocation of 10,000 USDC across chains
    console.log('\nCalculating optimal allocation of 10,000 USDC across chains...');
    const allocation = await bridge.calculateOptimalAllocation(10000);
    
    console.log('Optimal allocation:');
    for (const [chain, amount] of Object.entries(allocation)) {
      console.log(`  ${chain}: $${amount.toFixed(2)}`);
    }
    
    // Stop the Julia bridge
    console.log('\nStopping Julia Bridge...');
    await bridge.stop();
    console.log('Julia Bridge stopped');
    
  } catch (error) {
    console.error('Error in cross-chain trading example:', error);
  }
}

/**
 * Populate mock market data for demonstration
 */
async function populateMockMarketData(bridge: CrossChainJuliaBridge) {
  console.log('Populating mock market data...');
  
  // ETH/USDC data
  bridge.updateMarketData('ETH/USDC', 'ethereum', {
    price: 3500,
    bid: 3498,
    ask: 3502,
    volume: 5000000,
    liquidity: 20000000,
    metrics: {
      volatility: 0.025,
      marketDepth: 5000000
    }
  });
  
  bridge.updateMarketData('ETH/USDC', 'base', {
    price: 3502,
    bid: 3500,
    ask: 3504,
    volume: 1200000,
    liquidity: 5000000,
    metrics: {
      volatility: 0.022,
      marketDepth: 1500000
    }
  });
  
  // BTC/USDC data
  bridge.updateMarketData('BTC/USDC', 'ethereum', {
    price: 62000,
    bid: 61950,
    ask: 62050,
    volume: 8000000,
    liquidity: 30000000,
    metrics: {
      volatility: 0.018,
      marketDepth: 8000000
    }
  });
  
  bridge.updateMarketData('BTC/USDC', 'base', {
    price: 62100,
    bid: 62050,
    ask: 62150,
    volume: 2000000,
    liquidity: 8000000,
    metrics: {
      volatility: 0.017,
      marketDepth: 2000000
    }
  });
  
  // SOL/USDC data
  bridge.updateMarketData('SOL/USDC', 'ethereum', {
    price: 146.5,
    bid: 146.3,
    ask: 146.7,
    volume: 3000000,
    liquidity: 10000000,
    metrics: {
      volatility: 0.035,
      marketDepth: 3000000
    }
  });
  
  bridge.updateMarketData('SOL/USDC', 'solana', {
    price: 145.0,
    bid: 144.8,
    ask: 145.2,
    volume: 10000000,
    liquidity: 50000000,
    metrics: {
      volatility: 0.03,
      marketDepth: 10000000
    }
  });
  
  // Add historical data to simulate price movements
  const now = Date.now();
  const hourInMs = 3600000;
  
  // ETH/USDC historical data on Ethereum
  for (let i = 1; i <= 24; i++) {
    const timestamp = now - (i * hourInMs);
    const noise = Math.random() * 40 - 20; // Random noise between -20 and +20
    
    bridge.updateMarketData('ETH/USDC', 'ethereum', {
      price: 3500 + noise,
      volume: 5000000 * (0.7 + Math.random() * 0.6),
      liquidity: 20000000 * (0.8 + Math.random() * 0.4),
      timestamp
    });
  }
  
  // BTC/USDC historical data on Ethereum
  for (let i = 1; i <= 24; i++) {
    const timestamp = now - (i * hourInMs);
    const noise = Math.random() * 600 - 300; // Random noise between -300 and +300
    
    bridge.updateMarketData('BTC/USDC', 'ethereum', {
      price: 62000 + noise,
      volume: 8000000 * (0.7 + Math.random() * 0.6),
      liquidity: 30000000 * (0.8 + Math.random() * 0.4),
      timestamp
    });
  }
  
  // SOL/USDC historical data on Solana
  for (let i = 1; i <= 24; i++) {
    const timestamp = now - (i * hourInMs);
    const noise = Math.random() * 4 - 2; // Random noise between -2 and +2
    
    bridge.updateMarketData('SOL/USDC', 'solana', {
      price: 145.0 + noise,
      volume: 10000000 * (0.7 + Math.random() * 0.6),
      liquidity: 50000000 * (0.8 + Math.random() * 0.4),
      timestamp
    });
  }
  
  console.log('Mock market data populated');
}

// Run the example
main().catch(console.error); 