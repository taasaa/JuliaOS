# JuliaOS Swarm Package

This package implements swarm intelligence algorithms for optimization in DeFi trading strategies within the JuliaOS framework.

## 📋 Table of Contents

- [Purpose](#purpose)
- [Installation](#installation)
- [Algorithms](#algorithms)
- [Usage](#usage)
- [Integration](#integration)
- [Performance](#performance)
- [Development](#development)
- [References](#references)

## Purpose

The `julia-swarm` package provides the core implementation of various swarm intelligence algorithms optimized for DeFi trading. These algorithms are used to:

1. **Optimize trading parameters**: Find optimal entry/exit points, position sizes, and risk parameters
2. **Identify market patterns**: Detect complex patterns in market data
3. **Perform multi-objective optimization**: Balance risk and reward across multiple trading pairs
4. **Adapt to market conditions**: Dynamically adjust strategies as market conditions change

## Installation

```bash
# From within your project
npm install @juliaos/julia-swarm

# Or if working with the monorepo
npm install
```

Julia Dependencies:
```julia
# Inside Julia REPL
using Pkg
Pkg.add(["JSON", "Statistics", "LinearAlgebra", "Random", "Dates"])
```

## Algorithms

This package implements the following swarm intelligence algorithms:

### Particle Swarm Optimization (PSO)
Good general-purpose algorithm for parameter optimization. Works by simulating particles moving through the parameter space, remembering both personal and global best positions.

```julia
# Key parameters
inertia_weight = 0.7       # Controls particle momentum
cognitive_coef = 1.5       # Weight for particle's personal best
social_coef = 1.5          # Weight for swarm's global best
max_velocity = 1.0         # Maximum velocity limit
```

### Grey Wolf Optimizer (GWO)
Excels in changing market conditions. Mimics the leadership hierarchy and hunting mechanism of grey wolves in nature.

```julia
# Key parameters
alpha_param = 2.0          # Controls exploration vs. exploitation
decay_rate = 0.01          # Decreases alpha over iterations
```

### Whale Optimization Algorithm (WOA)
Great for volatile markets. Simulates the hunting behavior of humpback whales, especially their bubble-net feeding strategy.

```julia
# Key parameters
a_decrease_factor = 2.0    # Controls search expansion
spiral_constant = 1.0      # Spiral shape coefficient
```

### Genetic Algorithm (GA)
Best for complex trading strategies. Uses mechanisms inspired by natural evolution: selection, crossover, and mutation.

```julia
# Key parameters
crossover_rate = 0.8       # Probability of crossover
mutation_rate = 0.1        # Probability of mutation
elitism_count = 2          # Number of elite solutions to preserve
tournament_size = 3        # Size of tournament selection
```

### Ant Colony Optimization (ACO)
Optimal for path-dependent trading. Based on the behavior of ants searching for food by depositing pheromones.

```julia
# Key parameters
evaporation_rate = 0.1     # Pheromone evaporation rate
alpha = 1.0                # Pheromone importance
beta = 2.0                 # Heuristic information importance
```

## Usage

### TypeScript Interface

```typescript
import { SwarmConfig, SwarmOptimizationInput, TradingSignal } from '@juliaos/julia-swarm';
import { JuliaBridge } from '@juliaos/julia-bridge';

// Create and initialize the Julia bridge
const bridge = new JuliaBridge();
await bridge.initialize();

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

// Create a swarm
const swarmId = await bridge.createSwarm(swarmConfig);

// Prepare market data
const marketData = [
  {
    symbol: 'ETH/USDC',
    price: 3500.25,
    volume: 25000000,
    timestamp: new Date(),
    indicators: {
      rsi: 48.5,
      macd: 0.002,
      ma50: 3450.75,
      ma200: 3200.50
    }
  },
  // More data points...
];

// Create optimization input
const optimizationInput: SwarmOptimizationInput = {
  swarmId: swarmId,
  marketData: marketData,
  tradingPairs: ['ETH/USDC'],
  riskParameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2
  }
};

// Run optimization
const signal: TradingSignal = await bridge.optimizeSwarm(optimizationInput);

console.log(signal);
// {
//   action: 'buy',
//   amount: 0.5,
//   confidence: 0.87,
//   timestamp: new Date(),
//   indicators: { rsi: 48.5, macd: 0.002 },
//   reasoning: 'RSI neutral with positive MACD and price above MA50'
// }
```

## Julia Code Structure

The Julia code in this package is organized as follows:

- `JuliaSwarm.jl`: Main module entry point
- `swarm_algorithms.jl`: Base definitions and implementations for all algorithms
- `main.jl`: Integration with the JuliaOS TypeScript bridge
- `setup.jl`: Environment setup and dependency management
- Algorithm implementations:
  - Particle Swarm Optimization (PSO)
  - Grey Wolf Optimizer (GWO)
  - Whale Optimization Algorithm (WOA)
  - Genetic Algorithm (GA)
  - Ant Colony Optimization (ACO)
- Support modules:
  - Utility functions
  - Technical indicators
  - Market data processing

## Integration

### Relationship with julia-bridge

While the `julia-swarm` package contains the actual implementations of swarm intelligence algorithms, the `julia-bridge` package provides the communication layer between TypeScript and Julia. The `julia-bridge` package uses the swarm package to execute the algorithms.

### Integration with JuliaOS Core

This package integrates with the JuliaOS core framework for:
- Event handling and notifications
- Configuration management
- Type definitions
- Error handling and reporting

## Performance

Swarm algorithms are computationally intensive, but Julia's high-performance makes them feasible for real-time trading:

- **PSO**: O(n * d * i) where n = swarm size, d = dimensions, i = iterations
- **GWO**: O(n * d * i) similar to PSO
- **GA**: O(n * d * i * c) where c is complexity of fitness function
- **ACO**: O(n * i * m) where m is the number of paths

Performance tips:
- Start with small swarm sizes (10-20) and increase as needed
- Use fewer iterations for real-time applications
- For complex objectives, use parallel evaluation when available
- Pre-calculate indicators to reduce computation time

## Development

### Extending with New Algorithms

1. Add a new algorithm implementation to `swarm_algorithms.jl`:

```julia
# Example: Adding Firefly Algorithm
mutable struct FireflyAlgorithm <: SwarmAlgorithm
    swarm_size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    light_absorption::Float64
    attractiveness::Float64
    randomization::Float64
    population::Matrix{Float64}
    fitness::Vector{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    
    function FireflyAlgorithm(light_absorption=1.0, attractiveness=1.0, randomization=0.2)
        return new(0, 0, [], light_absorption, attractiveness, randomization, 
                   Matrix{Float64}(undef, 0, 0), Float64[], Float64[], Inf)
    end
end

function initialize!(algorithm::FireflyAlgorithm, swarm_size::Int, dimension::Int, 
                     bounds::Vector{Tuple{Float64, Float64}})
    # Implementation details
end

function optimize!(algorithm::FireflyAlgorithm, objective_function::Function, 
                   iterations::Int)
    # Implementation details
end
```

2. Update the `create_algorithm` function in `JuliaSwarm.jl` to support the new algorithm.

3. Test the new algorithm with benchmark problems.

## References

- Kennedy, J., & Eberhart, R. (1995). [Particle swarm optimization](https://ieeexplore.ieee.org/document/488968)
- Mirjalili, S., et al. (2014). [Grey Wolf Optimizer](https://www.sciencedirect.com/science/article/abs/pii/S0965997813001853)
- Mirjalili, S., & Lewis, A. (2016). [The Whale Optimization Algorithm](https://www.sciencedirect.com/science/article/abs/pii/S0965997816300163)
- Mitchell, M. (1998). [An Introduction to Genetic Algorithms](https://mitpress.mit.edu/books/introduction-genetic-algorithms)
- Dorigo, M., & Stützle, T. (2004). [Ant Colony Optimization](https://mitpress.mit.edu/books/ant-colony-optimization) 