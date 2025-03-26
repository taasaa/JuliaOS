# JuliaOS Open Source AI Agent & Swarm Framework

*joo-LEE-uh-oh-ESS* /ˈdʒuː.li.ə.oʊ.ɛs/  

**Noun**  
**A powerful multi-chain, community driven, 3 in 1, Web3 focused project aiming at AI and Swarm technological Innovation, powered by Julia.**  

![JuliaOS Banner](./Banner.png)

*This repository is still being developed and serves as a POC to the more refined version after launch of JuliaOS. We encourage you to explore and provide the devs feedback on Telegram. Please note that you may experience errors and issues when using the modules and commands in their current state.

## Overview

JuliaOS is a comprehensive framework for building decentralized applications (DApps) with a focus on agent-based architectures, swarm intelligence, and cross-chain trading. It provides both a CLI interface for quick deployment and a framework API for custom implementations. By leveraging AI-powered agents and swarm optimization, JuliaOS enables sophisticated trading strategies across multiple blockchains.

## Features

### Core Features
- ⚡ Agent-based architecture
- 🧬 Swarm intelligence capabilities
- ⛓️ Multi-chain support (Ethereum, Base, Solana)
- 📡 Advanced trading capabilities
- 🔐 Built-in security features
- 📊 Performance monitoring
- 🖥️ Extensive CLI tools
- 📘 Comprehensive documentation
- 🌐 Multi-wallet support (MetaMask, Phantom, Rabby)
- 🛰️ Chainlink price feeds integration

### Trading Components
- **Market Data Service**: Real-time price and liquidity tracking across chains
- **Position Management**: Cross-chain position tracking and management
- **Risk Management**: Chain-specific and cross-chain risk controls
- **Execution System**: Optimized execution across multiple DEXes
- **Monitoring System**: Comprehensive cross-chain analytics

### Security Components
- **SecurityManager**: Core security infrastructure with emergency response capabilities
- **Cross-Chain Security**: Bridge authentication and encrypted communications
- **Risk Assessment**: Real-time transaction and smart contract risk evaluation
- **Anomaly Detection**: ML-powered monitoring for suspicious activity
- **Emergency Response**: Automated incident response and circuit breakers
- **User-Extensible Security**: Custom security modules via the UserModules system

### Agent System
- **Solana-First Strategy**: Prioritized execution on Solana
- **Multiple Trading Strategies**: Choose your own
- **Cross-Chain Arbitrage**: Opportunities across chains

### Wallet Integrations
- **Browser Wallets**: MetaMask, Phantom, Rabby
- **Key Management**: Secure private key storage and encryption
- **Multi-Chain Support**: Single interface for all supported chains
- **CLI Configuration**: Easy wallet setup via CLI

### Price Feed Integrations
- **Chainlink Oracles**: Primary source for accurate price data
- **On-chain DEX Prices**: Backup price sources from major DEXes
- **Aggregated Pricing**: Confidence-weighted data from multiple sources
- **Configurable Sources**: Customizable price feed priorities

### CLI Features
- **Cross-Chain Support**: Trade across multiple blockchain networks
- **AI-Powered Agents**: Intelligent trading agents with customizable strategies
- **Swarm Intelligence**: Coordinated trading through agent swarms
- **Wallet Integration**: Support for multiple wallet types
- **Security**: Built-in security measures and best practices
- **Monitoring**: Comprehensive monitoring and logging capabilities

### Trading Strategies
- **Arbitrage**: Cross-chain price arbitrage
- **Market Making**: Automated market making
- **Yield Farming**: Optimized yield farming across chains
- **Custom Strategies**: Extensible strategy framework

### Technical Features
- **TypeScript/Node.js**: Modern, type-safe implementation
- **Julia Integration**: High-performance trading logic
- **Prometheus Metrics**: Detailed performance monitoring
- **Elasticsearch Logging**: Advanced log aggregation
- **Health Checks**: System and network monitoring
- **Alert System**: Customizable alerts and notifications

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v7 or later)
- [Julia](https://julialang.org/downloads/) (v1.8 or later)
- [Git](https://git-scm.com/downloads)

### CLI Installation

The JuliaOS CLI (`j3os`) provides a command-line interface for creating and managing AI-powered trading agents and swarms.

#### Option 1: Install from npm (Recommended)

```bash
# Install the CLI globally
npm install -g @juliaos/cli

# If you already have an older version installed
npm uninstall -g @juliaos/cli
npm install -g @juliaos/cli

# Use the CLI from anywhere
j3os init my-project
j3os help
```

#### Option 2: Use from Repository

```bash
# Clone this repository
git clone https://github.com/juliaos/framework.git
cd framework

# For Windows
.\j3os.bat init my-project

# For Mac/Linux (make it executable first)
chmod +x j3os.sh
./j3os.sh init my-project
```

### CLI Commands

```bash
# Create a new project
j3os init my-project

# Create a DeFi trading swarm
j3os defi create-swarm

# Start Julia bridge
j3os julia bridge --start

# Run backtesting
j3os defi backtesting --pair ETH/USDC --days 30

# Show help
j3os help

# Show version
j3os version
```

For a complete list of CLI commands, see the [CLI documentation](./packages/juliaos-cli/README.md).

### Example: Creating and Running a Simple Agent

```bash
# Create a new project
j3os init trading-agent

# Navigate to the project
cd trading-agent

# Install dependencies
npm install

# Build the project
npm run build

# Run the project
npm start
```

## Architecture

JuliaOS follows a modular architecture with the following key components:

```
packages/              # Core packages (monorepo)
├── core/              # Framework core functionality
├── julia-bridge/      # TypeScript-Julia integration
├── julia-swarm/       # Swarm intelligence algorithms
├── platforms/         # Platform integrations (Discord, Telegram, etc.)
├── protocols/         # Blockchain protocol implementations
├── wallets/           # Wallet integrations
└── agents/            # Agent implementations

bridges/               # Cross-chain bridges
├── relay/             # Relay service
├── solana-bridge/     # Solana bridge implementation
└── ethereum-bridge/   # Ethereum bridge implementation

contracts/             # Smart contracts
├── ethereum/          # Ethereum contracts
└── solana/            # Solana contracts

julia/                 # Julia language components
├── src/               # Julia source code
└── test/              # Julia tests

cli/                   # Command-line interface
```

For a detailed architecture overview, see [STRUCTURE.md](./STRUCTURE.md).

## Framework Components

### Core Framework

The core framework provides the foundation for building agents, implementing swarm intelligence, and interacting with blockchains:

```typescript
import { BaseAgent, SwarmAgent, Skill } from '@juliaos/core';
import { JuliaBridge } from '@juliaos/julia-bridge';

// Create an agent with swarm capabilities
const agent = new SwarmAgent({
  name: 'DeFiTradingAgent',
  type: 'trading',
  swarmConfig: {
    size: 30,
    communicationProtocol: 'gossip',
    consensusThreshold: 0.7,
    updateInterval: 5000
  }
});

// Initialize and start the agent
await agent.initialize();
await agent.start();
```

For more examples, see the [Core Framework Documentation](./packages/core/README.md).

### Julia Integration

JuliaOS uses Julia for high-performance computing tasks, such as swarm optimization algorithms:

```typescript
import { JuliaBridge } from '@juliaos/julia-bridge';

// Create and initialize the bridge
const bridge = new JuliaBridge();
await bridge.initialize();

// Create a swarm for optimization
const swarmId = await bridge.createSwarm({
  size: 30,
  algorithm: 'pso',
  parameters: {
    maxPositionSize: 1000,
    stopLoss: 0.05,
    takeProfit: 0.1
  }
});

// Run optimization
const result = await bridge.optimizeSwarm(swarmId, marketData);
```

For more on Julia integration, see:
- [Julia Bridge Documentation](./packages/julia-bridge/README.md)
- [Julia Swarm Documentation](./packages/julia-swarm/README.md)

## Development Guide

### Project Setup

1. Clone the repository:
```bash
git clone https://github.com/juliaos/framework.git
cd framework
```

2. Install dependencies:
```bash
npm install
```

3. Build all packages:
```bash
npm run build
```

### Development Workflow

1. Make changes to the relevant packages
2. Build the affected packages:
```bash
npm run build --filter=@juliaos/core
```

3. Run tests:
```bash
npm test
```

### Common Issues

- **TypeScript Errors**: Ensure you have the correct TypeScript version installed.
- **Julia Integration**: Make sure Julia is installed and accessible in your PATH.
- **Package Dependencies**: If using unpublished packages, use workspace references in `package.json`.

### Testing Security

To help ensure security when pushing to public repositories, this project includes helper scripts:

```bash
# On Windows
scripts\clean-sensitive-files.bat

# On Mac/Linux
chmod +x scripts/clean-sensitive-files.sh
scripts/clean-sensitive-files.sh
```

These scripts remove sensitive files from git tracking without deleting them from your workspace.

## Security

For security best practices and vulnerability reporting, please see [SECURITY.md](./SECURITY.md).

## Contributing

We welcome contributions from the community! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- Documentation (Coming Soon)
- GitHub Issues (Coming Soon)
- Email Support (Coming Soon)

## Project Structure

```
my-trading-project/
├── src/
│   ├── agents/           # Trading agents
│   ├── strategies/       # Trading strategies
│   ├── networks/         # Network configurations
│   └── utils/           # Utility functions
├── config/
│   ├── agents.json      # Agent configurations
│   ├── networks.json    # Network settings
│   └── strategies.json  # Strategy parameters
├── logs/                # Application logs
├── tests/              # Test files
└── package.json        # Project dependencies
```

### Testing
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Environment Variables
```bash
# Required
J3OS_PRIVATE_KEY=your_private_key
J3OS_RPC_URL=your_rpc_url

# Optional
J3OS_LOG_LEVEL=info
J3OS_MONITORING_PORT=9090
```

## Monitoring

### Metrics
```bash
# Start metrics server
j3os monitor start

# View metrics
curl http://localhost:9090/metrics
```

### Logs
```bash
# View logs
j3os monitor logs

# Filter logs
j3os monitor logs --level error
```

### Alerts
```bash
# Set up alerts
j3os monitor add --type balance --threshold 0.1

# List alerts
j3os monitor list
```