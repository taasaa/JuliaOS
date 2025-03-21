# API Reference

This document provides detailed information about the classes, methods, and interfaces available in the JuliaOS Framework.

## Classes

### Agent

The `Agent` class is responsible for executing trading strategies and managing risk.

#### Methods

- `initialize()`: Initializes the agent and its resources.
- `onUpdate()`: Handles updates and executes the trading strategy.
- `calculatePositionSize(token: Token, marketData: any): string`: Calculates the position size based on risk parameters.
- `saveState(state: any): Promise<void>`: Saves the agent's state.
- `loadState(): Promise<any>`: Loads the agent's state.

### Swarm

The `Swarm` class manages multiple agents and coordinates their actions.

#### Methods

- `start()`: Starts the swarm and its agents.
- `coordinate()`: Coordinates the actions of the agents in the swarm.
- `saveState(state: any): Promise<void>`: Saves the swarm's state.
- `loadState(): Promise<any>`: Loads the swarm's state.

## Interfaces

### AgentConfig

Defines the configuration for an agent.

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

### SwarmConfig

Defines the configuration for a swarm.

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

## Services

### MarketDataService

Provides market data for trading decisions.

#### Methods

- `getMarketData(token: Token): Promise<any>`: Retrieves market data for a given token.
- `getPrice(token: Token): Promise<number>`: Retrieves the current price of a token.
- `getVolume(token: Token): Promise<number>`: Retrieves the trading volume of a token.

### TradingService

Executes trades and manages positions.

#### Methods

- `openPosition(params: TradeParams): Promise<void>`: Opens a new trading position.
- `closePosition(tokenAddress: string): Promise<void>`: Closes an existing trading position.
- `updatePositions(): Promise<void>`: Updates the current trading positions.

## Types

### Token

Represents a cryptocurrency token.

```typescript
interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
}
```

### TradeParams

Defines the parameters for a trade.

```typescript
interface TradeParams {
  token: Token;
  amount: string;
  slippageTolerance: number;
  stopLoss: string;
  takeProfit: string;
}
```

## Next Steps

1. Explore the [Component Guide](components.md) for more implementation details.
2. Check out the [Examples](../examples/) section for practical use cases.
3. Review [Security Best Practices](../advanced/security.md) for production deployment. 