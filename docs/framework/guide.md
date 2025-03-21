# Framework Guide

This guide provides detailed information about using the JuliaOS Framework for building custom trading solutions.

## Core Components

### Agent

The `Agent` class is the fundamental building block of the framework. Each agent represents an individual trading entity with its own strategy and risk management.

```typescript
import { Agent } from '@juliaos/core';

class TradingAgent extends Agent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async initialize() {
    // Initialize agent resources
  }

  async onUpdate() {
    // Handle updates and make trading decisions
  }
}
```

#### Agent Configuration

```typescript
interface AgentConfig {
  id: string;
  tradingService: TradingService;
  marketDataService: MarketDataService;
  riskParameters: {
    maxPositionSize: string;
    stopLossPercentage: number;
    takeProfitPercentage: number;
  };
  tradingParameters: {
    entryThreshold: number;
    exitThreshold: number;
    stopLossPercentage: number;
    takeProfitPercentage: number;
  };
  strategy: {
    type: 'momentum' | 'mean-reversion' | 'trend-following';
    parameters: Record<string, number>;
  };
}
```

### Swarm

The `Swarm` class manages multiple agents and coordinates their actions:

```typescript
import { Swarm } from '@juliaos/core';

const swarm = new Swarm({
  agents: [agent1, agent2],
  coordinationStrategy: 'hierarchical',
  coordinationParameters: {
    leaderWeight: 0.6,
    followerWeight: 0.4
  }
});
```

#### Swarm Configuration

```typescript
interface SwarmConfig {
  agents: Agent[];
  coordinationStrategy: 'hierarchical' | 'democratic' | 'weighted';
  coordinationParameters: {
    leaderWeight?: number;
    followerWeight?: number;
    votingThreshold?: number;
  };
}
```

## Trading Strategies

### Momentum Trading

```typescript
class MomentumAgent extends Agent {
  async generateMomentumSignal(token: Token, marketData: any): Promise<{ shouldTrade: boolean; amount: string }> {
    const priceChange = marketData.priceChange24h || 0;
    const volumeChange = marketData.volumeChange24h || 0;

    if (priceChange > this.strategy.parameters.momentumThreshold && 
        volumeChange > this.strategy.parameters.volumeThreshold) {
      return {
        shouldTrade: true,
        amount: this.calculatePositionSize(token, marketData)
      };
    }

    return { shouldTrade: false, amount: '0' };
  }
}
```

### Mean Reversion

```typescript
class MeanReversionAgent extends Agent {
  async generateMeanReversionSignal(token: Token, marketData: any): Promise<{ shouldTrade: boolean; amount: string }> {
    const price = parseFloat(marketData.price);
    const movingAverage = await this.calculateMovingAverage(token, 20);

    if (Math.abs(price - movingAverage) / movingAverage > this.strategy.parameters.deviationThreshold) {
      return {
        shouldTrade: true,
        amount: this.calculatePositionSize(token, marketData)
      };
    }

    return { shouldTrade: false, amount: '0' };
  }
}
```

### Trend Following

```typescript
class TrendFollowingAgent extends Agent {
  async generateTrendFollowingSignal(token: Token, marketData: any): Promise<{ shouldTrade: boolean; amount: string }> {
    const shortMA = await this.calculateMovingAverage(token, 20);
    const longMA = await this.calculateMovingAverage(token, 50);

    if (shortMA > longMA && marketData.priceChange24h > 0) {
      return {
        shouldTrade: true,
        amount: this.calculatePositionSize(token, marketData)
      };
    }

    return { shouldTrade: false, amount: '0' };
  }
}
```

## Risk Management

### Position Sizing

```typescript
private calculatePositionSize(token: Token, marketData: any): string {
  const maxPositionValue = parseFloat(this.riskParameters.maxPositionSize);
  const currentPrice = parseFloat(marketData.price);
  return (maxPositionValue / currentPrice).toString();
}
```

### Stop Loss and Take Profit

```typescript
private async evaluatePosition(position: any): Promise<void> {
  const marketData = await this.marketDataService.getMarketData(position.token, USDC);
  if (!marketData) return;

  const currentPrice = parseFloat(marketData.price);
  const entryPrice = parseFloat(position.entryPrice);
  const priceChange = (currentPrice - entryPrice) / entryPrice * 100;

  // Check stop loss
  if (priceChange <= -this.tradingParameters.stopLossPercentage) {
    await this.tradingService.closePosition(position.token.address);
    this.metrics.losingTrades++;
    return;
  }

  // Check take profit
  if (priceChange >= this.tradingParameters.takeProfitPercentage) {
    await this.tradingService.closePosition(position.token.address);
    this.metrics.winningTrades++;
    return;
  }
}
```

## Performance Monitoring

### Metrics Tracking

```typescript
interface AgentMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
}
```

### State Management

```typescript
async saveState(state: any): Promise<void> {
  this.state = state;
}

async loadState(): Promise<any> {
  return this.state;
}
```

## Best Practices

1. **Agent Design**
   - Keep agents focused on a single responsibility
   - Implement proper error handling
   - Use state management for persistence
   - Monitor performance metrics

2. **Swarm Coordination**
   - Choose appropriate coordination strategy
   - Balance agent weights carefully
   - Monitor swarm performance
   - Implement proper error recovery

3. **Risk Management**
   - Set appropriate position sizes
   - Implement stop-loss and take-profit
   - Monitor drawdown
   - Track performance metrics

4. **Performance Optimization**
   - Use caching where appropriate
   - Implement efficient state management
   - Monitor resource usage
   - Optimize network calls

## Next Steps

1. Read the [API Reference](api.md) for detailed method documentation
2. Explore the [Component Guide](components.md) for more implementation details
3. Check out the [Examples](../examples/) section for practical use cases
4. Review [Security Best Practices](../advanced/security.md) for production deployment 