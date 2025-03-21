# Getting Started with JuliaOS

Welcome to JuliaOS! This guide will help you get started with building AI-powered DeFi trading systems using our framework.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Julia Language** (v1.8 or later)
   ```bash
   curl -fsSL https://install.julialang.org | sh
   ```

2. **Node.js** (v16 or later)
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 16
   nvm use 16
   ```

3. **Git**
   ```bash
   # macOS
   brew install git

   # Ubuntu/Debian
   sudo apt-get install git
   ```

## Installation

1. **Install the JuliaOS CLI**
   ```bash
   npm install -g @juliaos/cli
   ```

2. **Create a new project**
   ```bash
   juliaos init my-trading-project
   cd my-trading-project
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

## Project Structure

After initialization, your project will have the following structure:

```
my-trading-project/
├── src/
│   ├── index.ts           # Main entry point
│   ├── agents/            # Trading agents
│   ├── strategies/        # Trading strategies
│   └── utils/            # Utility functions
├── tests/                # Test files
├── config/              # Configuration files
├── docs/               # Project documentation
├── package.json        # Node.js dependencies
├── Project.toml        # Julia dependencies
└── README.md          # Project documentation
```

## Quick Start Guide

1. **Create a new DeFi trading swarm**
   ```bash
   juliaos create --type swarm
   ```

2. **Configure your swarm**
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
   ```

3. **Initialize and run the swarm**
   ```typescript
   await swarm.initialize();
   const result = await swarm.optimize();
   ```

4. **Execute trades**
   ```typescript
   const tradeResult = await swarm.executeTrade({
     pair: 'SOL/USDC',
     type: 'buy',
     amount: 0.1
   });
   ```

5. **Monitor portfolio**
   ```typescript
   const portfolio = await swarm.getPortfolio();
   ```

## Next Steps

- Read the [Core Concepts](core-concepts/README.md) to understand how JuliaOS works
- Check out the [API Reference](api-reference/README.md) for detailed documentation
- Follow the [Guides](guides/README.md) for step-by-step tutorials
- Explore the [Examples](examples/README.md) for real-world use cases

## Getting Help

- Check the [Troubleshooting Guide](troubleshooting/README.md) for common issues
- Join our [Discord community](https://discord.gg/juliaos) for support
- Open an issue on [GitHub](https://github.com/Juliaoscode/JuliaOSframework/issues) 