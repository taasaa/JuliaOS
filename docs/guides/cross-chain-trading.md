# Cross-Chain Trading Guide

This guide explains how to use JuliaOS for cross-chain trading operations, including setting up bridges, managing positions, and implementing trading strategies across multiple blockchains.

## Prerequisites

Before starting cross-chain trading, ensure you have:

- JuliaOS Framework installed (`npm install -g @juliaos/cli`)
- API keys for required services
- Wallet addresses on target chains (Ethereum, Base, Solana)
- RPC endpoints configured for each chain

## Setup

### 1. Configure Chain Endpoints

First, set up your `.env` file with all required chain RPC endpoints:

```bash
juliaos config env
```

This will prompt you for:
- Ethereum RPC URL
- Base RPC URL
- Solana RPC URL
- API keys for market data services

### 2. Configure Wallets

Add your wallet credentials for each chain:

```bash
juliaos config wallet --action add --address your_ethereum_address
juliaos config wallet --action add --address your_base_address
juliaos config wallet --action add --address your_solana_address
```

Keep your private keys secure and never commit them to version control.

## Cross-Chain Trading Architecture

JuliaOS uses a bridge architecture for cross-chain trading:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Ethereum   │  │    Base     │  │   Solana    │
│   Chain     │  │    Chain    │  │   Chain     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       │                │                │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  Ethereum   │  │    Base     │  │   Solana    │
│   Bridge    │  │    Bridge   │  │   Bridge    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────┬───────┴────────┬───────┘
                │                │
         ┌──────▼────────┐┌─────▼──────┐
         │  Cross-Chain  ││   Market   │
         │    Router     ││    Data    │
         └──────┬────────┘└─────┬──────┘
                │                │
                └───────┬────────┘
                        │
                 ┌──────▼──────┐
                 │  Trading    │
                 │   Agents    │
                 └─────────────┘
```

## Basic Cross-Chain Trading

### 1. Create a Cross-Chain Trading Agent

Create a new file `src/agents/CrossChainTrader.ts`:

```typescript
import { CrossChainAgent } from '@juliaos/core';

export class CrossChainTrader extends CrossChainAgent {
  async initialize() {
    // Setup chains and markets
    await this.connectChains(['ethereum', 'solana']);
    
    // Initialize market data feeds
    await this.initializeMarketData(['ETH/USDC', 'SOL/USDC']);
    
    // Set risk parameters
    this.setRiskParameters({
      maxExposurePerChain: {
        ethereum: '5000',   // $5000 USD max exposure
        solana: '10000'     // $10000 USD max exposure
      },
      maxSlippage: 0.5,     // 0.5% max slippage
      rebalanceThreshold: 5 // Rebalance when 5% price difference
    });
    
    console.log('Cross-chain trader initialized');
  }
  
  async onMarketUpdate(data) {
    // Analyze opportunities
    const opportunities = await this.findArbitrageOpportunities();
    
    if (opportunities.length > 0) {
      console.log(`Found ${opportunities.length} arbitrage opportunities`);
      
      // Execute top opportunity
      const bestOpp = opportunities[0];
      await this.executeArbitrage(bestOpp);
    }
  }
  
  async executeArbitrage(opportunity) {
    // Execute cross-chain trade
    const result = await this.executeCrossChainTrade({
      fromChain: opportunity.buyChain,
      toChain: opportunity.sellChain,
      tokenPair: opportunity.pair,
      amount: opportunity.optimalSize,
      expectedProfit: opportunity.expectedProfit
    });
    
    console.log(`Trade executed: ${result.txHash}`);
    return result;
  }
}
```

### 2. Run the Agent

Start your cross-chain trading agent:

```bash
juliaos start --strategy cross-chain --chains ethereum,solana
```

## Advanced Cross-Chain Features

### Position Management

JuliaOS provides tools for managing positions across chains:

```typescript
// Get positions across all chains
const positions = await agent.getPositions();

// Rebalance positions based on risk parameters
await agent.rebalancePositions();

// Close position on specific chain
await agent.closePosition('ethereum', 'ETH/USDC');
```

### Risk Management

Implement risk management with the built-in tools:

```typescript
// Set maximum drawdown
agent.setMaxDrawdown(10); // 10%

// Set daily loss limit
agent.setDailyLossLimit(1000); // $1000 USD

// Enable automatic stop-loss
agent.enableAutoStopLoss({
  percentage: 5,  // 5% move against position
  trailing: true  // Trailing stop loss
});
```

### Monitoring

Monitor your cross-chain trading operations:

```bash
# View trading status
juliaos status

# Monitor positions
juliaos positions

# View performance metrics
juliaos monitor

# Check logs
juliaos logs
```

## Performance Optimization

To optimize cross-chain trading:

1. Use Solana as the base chain for high-frequency operations:
```typescript
agent.setPrimaryChain('solana');
```

2. Batch operations where possible:
```typescript
await agent.batchExecute([trade1, trade2, trade3]);
```

3. Configure gas price strategies:
```typescript
agent.setGasStrategy({
  ethereum: 'fastest',
  base: 'average',
  solana: 'prioritized'
});
```

## Common Challenges and Solutions

### Bridge Delays

Cross-chain bridges can experience delays. Handle timeouts gracefully:

```typescript
try {
  const result = await agent.executeCrossChainTrade({
    // trade parameters
    timeout: 60000 // 60 seconds timeout
  });
} catch (error) {
  if (error.code === 'BRIDGE_TIMEOUT') {
    // Implement recovery strategy
    await agent.recoverFailedBridgeTransaction(error.txHash);
  }
}
```

### Liquidity Differences

Chains have varying liquidity profiles. Adapt your strategy:

```typescript
// Adjust trade size based on available liquidity
const scaledAmount = await agent.calculateOptimalTradeSize({
  pair: 'ETH/USDC',
  chains: ['ethereum', 'solana'],
  targetSlippage: 0.2
});
```

## Next Steps

1. Explore [Advanced Trading Strategies](../advanced/trading-strategies.md)
2. Learn about [Custom Bridge Integration](../advanced/custom-bridges.md)
3. Study [Cross-Chain Data Consistency](../advanced/data-consistency.md)
4. Review [Security Best Practices](../advanced/security.md) 