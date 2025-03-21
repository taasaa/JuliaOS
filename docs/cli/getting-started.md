# Getting Started with JuliaOS CLI

This guide will help you get started with the JuliaOS CLI tool for managing cross-chain operations and DEX interactions.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installing JuliaOS CLI

```bash
# Using npm
npm install -g @juliaos/cli

# Using yarn
yarn global add @juliaos/cli
```

### Verifying Installation

```bash
juliaos --version
```

## Basic Usage

### Configuration
First, you'll need to set up your configuration:

```bash
juliaos config init
```

This will create a configuration file at `~/.juliaos/config.json`. You'll need to add your:
- RPC endpoints
- API keys (if required)
- Wallet configurations

### Creating Agents and Swarms

#### Creating a Single Agent
```bash
# Create a new agent
juliaos agent create my-agent --type trading

# Create an agent with custom configuration
juliaos agent create my-agent --type trading --config config.json
```

#### Creating a Swarm
```bash
# Create a new swarm
juliaos swarm create my-swarm --type trading

# Create a swarm with multiple agents
juliaos swarm create my-swarm --type trading --agents 3
```

#### Managing Agents and Swarms
```bash
# List all agents
juliaos agent list

# List all swarms
juliaos swarm list

# Start an agent
juliaos agent start my-agent

# Start a swarm
juliaos swarm start my-swarm

# Stop an agent
juliaos agent stop my-agent

# Stop a swarm
juliaos swarm stop my-swarm
```

### Connecting to Networks

```bash
# Connect to Solana
juliaos network connect solana

# Connect to Ethereum
juliaos network connect ethereum

# Connect to multiple networks
juliaos network connect all
```

### DEX Operations

```bash
# View available DEXes
juliaos dex list

# Get price information
juliaos dex price SOL/USDC

# Execute a swap
juliaos dex swap SOL/USDC --amount 1.0
```

### Storage Operations

```bash
# Store data on Arweave
juliaos storage upload --provider arweave <file>

# Store data on IPFS
juliaos storage upload --provider ipfs <file>
```

## Examples

### Creating a Trading Agent
```bash
# Create a momentum trading agent
juliaos agent create momentum-agent --type trading --strategy momentum

# Create a mean-reversion agent
juliaos agent create mean-reversion-agent --type trading --strategy mean-reversion
```

### Creating a Trading Swarm
```bash
# Create a swarm with multiple trading strategies
juliaos swarm create trading-swarm --type trading --strategies momentum,mean-reversion,trend-following
```

### Basic Swap Operation
```bash
# Swap 1 SOL for USDC on Raydium
juliaos dex swap SOL/USDC --amount 1.0 --dex raydium
```

### Cross-Chain Transfer
```bash
# Transfer tokens from Solana to Ethereum
juliaos bridge transfer SOL/USDC --amount 100 --from solana --to ethereum
```

### Data Storage
```bash
# Store trading configuration on Arweave
juliaos storage upload --provider arweave config.json
```

## Next Steps

- [CLI Commands Reference](./commands.md)
- [CLI Examples](./examples.md)
- [Configuration Guide](../framework/configuration.md)
- [Security Best Practices](../framework/security.md) 