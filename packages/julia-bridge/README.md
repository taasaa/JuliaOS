# JuliaOS Bridge Package

This package provides the bridge between TypeScript/JavaScript and Julia for the JuliaOS framework. It enables seamless communication between the Node.js environment and Julia's scientific computing capabilities.

## 📋 Table of Contents

- [Purpose](#purpose)
- [Installation](#installation)
- [Components](#components)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Purpose

The `julia-bridge` package serves as the foundational communication layer between the JuliaOS TypeScript framework and Julia's scientific computing environment. It handles:

1. **Process Management**: Starting, monitoring, and managing Julia processes
2. **Data Serialization**: Converting between TypeScript and Julia data structures
3. **Command Execution**: Sending commands from TypeScript to Julia and receiving results
4. **Error Handling**: Robustly handling errors in cross-language communication

## Installation

```bash
# From within your project
npm install @juliaos/julia-bridge

# Or if working with the monorepo
npm install
```

Make sure you have Julia installed on your system (version 1.8 or later recommended). The bridge will attempt to find Julia in your system path, but you can also specify the path explicitly in configuration.

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

## Usage

### Basic Usage

```typescript
import { JuliaBridge } from '@juliaos/julia-bridge';

// Create a bridge instance
const bridge = new JuliaBridge({
  juliaPath: '/path/to/julia', // Optional, defaults to 'julia'
  autoReconnect: true // Optional, defaults to true
});

// Initialize the bridge
await bridge.initialize();

// Execute a simple Julia command
const result = await bridge.executeJuliaCode('1 + 1');
console.log(result); // 2

// Shutdown when done
await bridge.shutdown();
```

### Swarm Optimization

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
  marketData: [...], // Your market data here
  tradingPairs: ['ETH/USDC'],
  riskParameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1,
    maxDrawdown: 0.2
  }
});

console.log(tradingSignal);
// {
//   action: 'buy',
//   amount: 0.5,
//   confidence: 0.87,
//   timestamp: '2023-04-01T12:00:00Z',
//   indicators: { rsi: 32, macd: 0.002 },
//   reasoning: 'RSI oversold condition with positive MACD crossover'
// }

// Shutdown when done
await bridge.shutdown();
```

## API Reference

### JuliaBridge Class

#### Constructor

```typescript
constructor(options?: {
  juliaPath?: string;   // Path to Julia executable
  autoReconnect?: boolean; // Auto reconnect on failure
})
```

#### Methods

| Method | Description | Parameters | Return Type |
|--------|-------------|------------|-------------|
| `initialize()` | Initialize the bridge and start Julia process | None | `Promise<void>` |
| `shutdown()` | Shutdown the bridge and Julia process | None | `Promise<void>` |
| `executeJuliaCode(code: string)` | Execute arbitrary Julia code | code: string | `Promise<any>` |
| `createSwarm(config: SwarmConfig)` | Create a new swarm | config: SwarmConfig | `Promise<string>` (swarmId) |
| `optimizeSwarm(input: SwarmOptimizationInput)` | Run optimization on a swarm | input: SwarmOptimizationInput | `Promise<TradingSignal>` |
| `getSwarmStatus(swarmId: string)` | Get status of a swarm | swarmId: string | `Promise<any>` |
| `stopSwarm(swarmId?: string)` | Stop a swarm or all swarms | swarmId?: string | `Promise<void>` |
| `getActiveSwarms()` | Get all active swarm IDs | None | `Promise<string[]>` |

#### Events

- `initialized`: Emitted when the bridge is initialized
- `error`: Emitted when an error occurs
- `disconnected`: Emitted when the Julia process disconnects
- `reconnecting`: Emitted when attempting to reconnect
- `stdout`: Emitted for Julia stdout messages
- `swarmCreated`: Emitted when a new swarm is created
- `swarmOptimized`: Emitted when swarm optimization completes

## Error Handling

The bridge includes robust error handling with custom error types and retry mechanisms:

```typescript
try {
  await bridge.initialize();
  const result = await bridge.executeJuliaCode('1 / 0');
} catch (error) {
  if (error instanceof JuliaBridgeError) {
    console.error(`Bridge error (${error.code}): ${error.message}`);
    
    // Handle specific error codes
    if (error.code === 'PROCESS_NOT_RUNNING') {
      // Handle process error
    } else if (error.code === 'COMMAND_TIMEOUT') {
      // Handle timeout
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Relationship with julia-swarm

While the `julia-bridge` package provides the communication layer between TypeScript and Julia, the `julia-swarm` package contains the actual implementations of swarm intelligence algorithms for DeFi trading. The bridge package uses the swarm package's functionality but does not implement the algorithms itself.

## Development

To extend the bridge functionality, you'll need to modify both the TypeScript and Julia components to ensure they can communicate properly.

### Adding a New Command

1. Add the TypeScript method to `JuliaBridge.ts`:

```typescript
async newCommand(param1: string, param2: number): Promise<any> {
  try {
    return await this.sendCommand('new_command', { param1, param2 });
  } catch (error) {
    console.error('Failed to execute new command:', error);
    throw error;
  }
}
```

2. Add the corresponding Julia handler in `JuliaOSBridge.jl`:

```julia
function handle_new_command(data::Dict)
  param1 = data["param1"]
  param2 = data["param2"]
  
  # Process the command
  result = your_processing_function(param1, param2)
  
  return Dict(
    "success" => true,
    "result" => result
  )
end
```

3. Register the command in the Julia command handler.

## Troubleshooting

### Common Issues

- **Julia not found**: Make sure Julia is installed and in your PATH, or specify the full path in the constructor
- **Memory leaks**: Always call `shutdown()` when done to release resources
- **Timeout errors**: Increase timeout values for long-running operations
- **Process crashes**: Check Julia error logs and make sure all dependencies are installed 