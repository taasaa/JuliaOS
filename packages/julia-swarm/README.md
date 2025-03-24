# JuliaOS Swarm Package

This package implements swarm intelligence algorithms for optimization in DeFi trading strategies within the JuliaOS framework.

## Purpose

The `julia-swarm` package provides the core implementation of various swarm intelligence algorithms optimized for DeFi trading. These algorithms are used to:

1. **Optimize trading parameters**: Find optimal entry/exit points, position sizes, and risk parameters
2. **Identify market patterns**: Detect complex patterns in market data
3. **Perform multi-objective optimization**: Balance risk and reward across multiple trading pairs
4. **Adapt to market conditions**: Dynamically adjust strategies as market conditions change

## Implemented Algorithms

This package implements the following swarm intelligence algorithms:

- **Particle Swarm Optimization (PSO)**: Good general-purpose algorithm for parameter optimization
- **Grey Wolf Optimizer (GWO)**: Excels in changing market conditions
- **Whale Optimization Algorithm (WOA)**: Great for volatile markets
- **Genetic Algorithm (GA)**: Best for complex trading strategies
- **Ant Colony Optimization (ACO)**: Optimal for path-dependent trading

## Relationship with julia-bridge

While the `julia-swarm` package contains the actual implementations of swarm intelligence algorithms, the `julia-bridge` package provides the communication layer between TypeScript and Julia. The swarm package is used by the bridge package to execute the algorithms, but the bridge doesn't implement the algorithms itself.

## Julia Code Structure

The Julia code in this package is organized as follows:

- **SwarmAlgorithms.jl**: Base definitions and interfaces for all swarm algorithms
- **PSO.jl**: Particle Swarm Optimization implementation
- **GWO.jl**: Grey Wolf Optimizer implementation
- **WOA.jl**: Whale Optimization Algorithm implementation
- **GeneticAlgorithm.jl**: Genetic Algorithm implementation
- **ACO.jl**: Ant Colony Optimization implementation
- **Utils.jl**: Utility functions for data processing and analysis
- **Indicators.jl**: Technical indicators for market analysis

## TypeScript Interfaces

The package also provides TypeScript interfaces for configuring and using the swarm algorithms from the JavaScript/TypeScript environment:

```typescript
import { SwarmConfig, SwarmOptimizationInput } from '@juliaos/julia-swarm';

// Create a swarm configuration
const swarmConfig: SwarmConfig = {
  size: 30,
  algorithm: 'pso',
  parameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2,
    inertia: 0.7,
    cognitiveWeight: 1.5,
    socialWeight: 1.5
  }
};

// Create optimization input
const optimizationInput: SwarmOptimizationInput = {
  swarmId: "swarm-1",
  marketData: [...],
  tradingPairs: ['ETH/USDC'],
  riskParameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2
  }
};
```

## Integration with JuliaOS Core

This package leverages the core JuliaOS framework for event handling, configuration, and integration with the broader ecosystem. 