# API Reference

This section provides detailed documentation for the JuliaOS APIs.

## TypeScript API

### JuliaSwarm Class

The main class for creating and managing DeFi trading swarms.

```typescript
class JuliaSwarm {
  constructor(config: SwarmConfig);
  initialize(): Promise<void>;
  optimize(maxIterations?: number): Promise<{ position: number[], fitness: number }>;
  executeTrade(params: TradeParams): Promise<TradeResult>;
  getPortfolio(): Promise<PortfolioStatus>;
  stop(): Promise<void>;
}
```

### Interfaces

#### SwarmConfig
```typescript
interface SwarmConfig {
  type: 'particle' | 'ant' | 'bee' | 'firefly';
  size: number;
  network: 'solana' | 'ethereum' | 'base';
  parameters: SwarmParameters;
  trading_pairs: string[];
  risk_parameters: RiskParameters;
  wallet_addresses: string[];
}
```

#### SwarmParameters
```typescript
interface SwarmParameters {
  learningRate: number;
  inertia: number;
  cognitiveWeight: number;
  socialWeight: number;
}
```

#### RiskParameters
```typescript
interface RiskParameters {
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
  maxDrawdown: number;
  maxLeverage: number;
  minLiquidity: number;
  maxSlippage: number;
  positionSizing: Record<string, number>;
}
```

#### TradeParams
```typescript
interface TradeParams {
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price?: number;
}
```

#### TradeResult
```typescript
interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  profit?: number;
  timestamp: number;
}
```

#### PortfolioStatus
```typescript
interface PortfolioStatus {
  balances: Record<string, number>;
  positions: Record<string, {
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
  }>;
  totalValue: number;
  timestamp: number;
}
```

## Julia API

### Main Module
```julia
module JuliaSwarm

export initialize_swarm, optimize_swarm, execute_trade, get_portfolio

# Initialize a new trading swarm
function initialize_swarm(config::Dict{String, Any})
    # Implementation
end

# Optimize the swarm
function optimize_swarm(swarm::Swarm, max_iterations::Int=100)
    # Implementation
end

# Execute a trade
function execute_trade(swarm::Swarm, params::Dict{String, Any})
    # Implementation
end

# Get portfolio status
function get_portfolio(swarm::Swarm)
    # Implementation
end

end
```

### Types

```julia
struct Swarm
    type::String
    size::Int
    network::String
    parameters::Dict{String, Float64}
    trading_pairs::Vector{String}
    risk_parameters::Dict{String, Any}
    wallet_addresses::Vector{String}
    agents::Vector{Agent}
    market_data::Dict{String, Any}
end

struct Agent
    position::Vector{Float64}
    velocity::Vector{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    portfolio::Dict{String, Float64}
    risk_params::Dict{String, Float64}
end
```

## CLI Commands

### Global Commands

```bash
# Install JuliaOS CLI
npm install -g @juliaos/cli

# Create a new project
juliaos init <project-name>

# Create a new component
juliaos create --type <component-type>

# Build the project
juliaos build

# Run tests
juliaos test

# Start development server
juliaos dev
```

### Component Types

- `swarm`: DeFi trading swarm
- `agent`: Individual trading agent
- `strategy`: Trading strategy
- `risk`: Risk management module

### Configuration Options

```bash
# Create a swarm with specific configuration
juliaos create --type swarm \
  --algorithm particle \
  --size 100 \
  --network solana \
  --pairs SOL/USDC,RAY/USDC \
  --risk-params '{"maxPositionSize": 1.0, "stopLoss": 5.0}'
```

## Environment Variables

### Required Variables

```bash
# Network RPC URLs
ETH_RPC_URL=https://eth-mainnet.example.com
BASE_RPC_URL=https://base-mainnet.example.com

# API Keys (if using external services)
MARKET_DATA_API_KEY=your_api_key
```

### Optional Variables

```bash
# Debug mode
DEBUG=true

# Log level
LOG_LEVEL=info

# WebSocket URL
WS_URL=wss://your-websocket-url
```

## Error Handling

### Common Errors

```typescript
// Network connection error
{
  code: 'NETWORK_ERROR',
  message: 'Failed to connect to network',
  details: { network: 'solana', error: 'Connection timeout' }
}

// Trade validation error
{
  code: 'VALIDATION_ERROR',
  message: 'Trade validation failed',
  details: { reason: 'Position size exceeds limit' }
}

// Optimization error
{
  code: 'OPTIMIZATION_ERROR',
  message: 'Failed to optimize swarm',
  details: { iteration: 50, error: 'Convergence failed' }
}
```

### Error Handling Example

```typescript
try {
  await swarm.executeTrade({
    pair: 'SOL/USDC',
    type: 'buy',
    amount: 0.1
  });
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Trade validation failed:', error.details.reason);
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network error:', error.details.error);
  } else {
    console.error('Unexpected error:', error);
  }
}
``` 