# Julia-Swarm Package

A powerful package for implementing AI-powered DeFi trading using swarm intelligence algorithms.

## Features

- 🤖 Multiple swarm algorithms (PSO, ACO, ABC, Firefly)
- 📊 Real-time market data integration
- 💰 Portfolio management
- 🔄 Multi-chain support
- 📈 Risk management
- 🧪 Comprehensive testing suite

## Installation

```bash
npm install @juliaos/julia-swarm
```

## Quick Start

```typescript
import { JuliaSwarm } from '@juliaos/julia-swarm';

const swarm = new JuliaSwarm({
  type: 'particle',
  size: 100,
  network: 'solana',
  parameters: {
    learningRate: 0.1,
    inertia: 0.8,
    cognitiveWeight: 1.5,
    socialWeight: 1.5
  },
  trading_pairs: ['SOL/USDC', 'RAY/USDC'],
  risk_parameters: {
    maxPositionSize: 1.0,
    stopLoss: 5.0,
    takeProfit: 10.0,
    maxDrawdown: 20.0,
    maxLeverage: 2.0,
    minLiquidity: 100000,
    maxSlippage: 1.0,
    positionSizing: {
      'SOL/USDC': 0.5,
      'RAY/USDC': 0.5
    }
  },
  wallet_addresses: [
    'your_wallet_address_1',
    'your_wallet_address_2'
  ]
});

// Initialize and run
await swarm.initialize();
const result = await swarm.optimize();
```

## Core Components

### JuliaSwarm Class

The main class for managing the trading swarm.

#### Configuration

```typescript
interface SwarmConfig {
  type: 'particle' | 'ant' | 'bee' | 'firefly';
  size: number;
  network: 'solana' | 'ethereum' | 'base';
  parameters: {
    learningRate: number;
    inertia: number;
    cognitiveWeight: number;
    socialWeight: number;
  };
  trading_pairs: string[];
  risk_parameters: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDrawdown: number;
    maxLeverage: number;
    minLiquidity: number;
    maxSlippage: number;
    positionSizing: Record<string, number>;
  };
  wallet_addresses: string[];
}
```

#### Key Methods

- `initialize()`: Sets up the swarm and connects to the blockchain
- `optimize(iterations?: number)`: Runs the optimization process
- `executeTrade(trade: Trade)`: Executes a trade on the blockchain
- `getPortfolio()`: Retrieves current portfolio status
- `validateTrade(trade: Trade)`: Validates a trade before execution
- `stop()`: Stops the swarm and cleans up resources

### Portfolio Management

The package includes comprehensive portfolio management features:

- Real-time balance tracking
- Position sizing
- Risk management
- Portfolio rebalancing
- Performance analytics

### Risk Management

Built-in risk management features:

- Position size limits
- Stop-loss and take-profit orders
- Maximum drawdown protection
- Leverage limits
- Liquidity requirements
- Slippage protection

## Testing

The package includes a comprehensive test suite:

```typescript
// Run all tests
npm test

// Run specific test file
npm test -- src/__tests__/JuliaSwarm.test.ts

// Run with coverage
npm test -- --coverage
```

### Test Environment

The package provides a test environment for development:

```typescript
import { JuliaSwarm } from '@juliaos/julia-swarm';

const swarm = new JuliaSwarm({
  // ... config
  testMode: true,
  testError: false // Set to true to test error handling
});
```

## Error Handling

The package includes robust error handling:

- WebSocket connection errors
- Trade validation errors
- Portfolio balance errors
- Network errors
- Test mode errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details 