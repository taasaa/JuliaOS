# JuliaOS Bridge Package

This package provides the bridge between TypeScript/JavaScript and Julia for the JuliaOS framework. It enables seamless communication between the Node.js environment and Julia's scientific computing capabilities.

## Purpose

The `julia-bridge` package serves as the foundational communication layer between the JuliaOS TypeScript framework and Julia's scientific computing environment. It handles:

1. **Process Management**: Starting, monitoring, and managing Julia processes
2. **Data Serialization**: Converting between TypeScript and Julia data structures
3. **Command Execution**: Sending commands from TypeScript to Julia and receiving results
4. **Error Handling**: Robustly handling errors in cross-language communication

## Components

### TypeScript Components

- `JuliaBridge.ts`: Main bridge class that handles communication with Julia processes
- `CrossChainJuliaBridge.ts`: Extended bridge for cross-chain functionality
- `MLBridge.ts`: Machine learning specific bridge

### Julia Components

- `JuliaOS.jl`: Main Julia entry point and message handling
- `JuliaOSBridge.jl`: Core bridge functionality on the Julia side
- `SwarmManager.jl`: Management of swarm algorithms (interfaces with `julia-swarm`)
- `Swarm.jl`: Base swarm algorithm implementations
- `MarketData.jl`: Market data handling utilities

## Relationship with julia-swarm

While `julia-bridge` provides the communication layer between TypeScript and Julia, the `julia-swarm` package contains the actual implementations of swarm intelligence algorithms for DeFi trading. The bridge package uses the swarm package's functionality but does not implement the algorithms itself.

## Usage Example

```typescript
import { JuliaBridge } from '@juliaos/julia-bridge';

// Create a bridge instance
const bridge = new JuliaBridge();

// Initialize the bridge
await bridge.initialize();

// Create a swarm
const swarmId = await bridge.createSwarm({
  size: 30,
  algorithm: 'pso',
  parameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2
  }
});

// Use the swarm for optimization
const tradingSignal = await bridge.optimizeSwarm({
  swarmId,
  marketData: [...],
  tradingPairs: ['ETH/USDC'],
  riskParameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2
  }
});

// Shutdown when done
await bridge.shutdown();
```

## Development

To extend the bridge functionality, you'll need to modify both the TypeScript and Julia components to ensure they can communicate properly. 