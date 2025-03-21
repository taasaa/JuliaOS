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

## Quick Start

### CLI Installation

The JuliaOS CLI (`j3os`) provides a command-line interface for creating and managing AI-powered trading agents and swarms. You have two options for installing and using the CLI:

#### Option 1: Install from npm (Recommended)

```bash
# Install the CLI globally
npm install -g @juliaos/cli

# If you already have an older version installed, you might need to uninstall it first:
npm uninstall -g @juliaos/cli
# Or use the force flag:
npm install -g @juliaos/cli --force

# Now you can use the CLI from anywhere
j3os init my-project
j3os help
```

#### Option 2: Use from Repository

If you're working with the repository directly:

1. Clone this repository:
```bash
git clone https://github.com/juliaos/framework.git
cd framework
```

2. Use the CLI scripts directly:
   - For Windows: Use `.\j3os.bat` in the root directory
   - For Mac/Linux: Use `./j3os.sh` in the root directory (make it executable first with `chmod +x j3os.sh`)

### CLI Usage

```bash
# If installed via npm (Option 1)
j3os init my-project
j3os version
j3os help

# If using repository directly (Option 2)
# For Windows
.\j3os.bat init my-project
.\j3os.bat version
.\j3os.bat help

# For Mac/Linux
./j3os.sh init my-project
./j3os.sh version
./j3os.sh help
```

#### Troubleshooting

#### Available Commands
- `j3os init [project-name]` - Create a new JuliaOS project
- `j3os create` - Create a new component (coming soon)
- `j3os version` - Show version information
- `j3os help` - Show help information

#### Common CLI Installation Issues

- **EEXIST error on Windows**: If you see an error like `EEXIST: file already exists`, try uninstalling the CLI first:
  ```bash
  npm uninstall -g @juliaos/cli
  npm install -g @juliaos/cli
  ```

- **Permission denied on Mac/Linux**: If you encounter permission issues, try using sudo or fixing npm permissions:
  ```bash
  sudo npm install -g @juliaos/cli
  # Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
  ```

- **Module not found errors**: If the CLI fails with "module not found" errors, make sure you have the latest version:
  ```bash
  npm install -g @juliaos/cli@latest
  ```

#### Project Build Issues

- **Missing @juliaos/core**: This package may not be published yet. Remove it from dependencies in package.json.
- **Template string errors**: If you see syntax errors in the generated files, make sure the backticks are properly escaped.
- **TypeScript errors**: Make sure you have TypeScript installed: `npm install -g typescript`

### Project Structure

When you create a new project with `j3os init`, it generates the following structure:

```
my-project/
├── src/                 # Source code
│   ├── agents/          # Agent implementations
│   │   └── SampleAgent.ts  # Sample agent class
│   ├── skills/          # Agent skills
│   └── index.ts         # Main entry point
├── test/                # Test files
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── .gitignore           # Git ignore file
└── README.md            # Project documentation
```

#### Testing the Generated Project

To test the generated project:

```bash
cd my-project
npm install  # Note: You may see an error about @juliaos/core not being found
npm run build
npm run start
```

If you encounter an error about `@juliaos/core` not being found, you can modify the `package.json` file to remove this dependency temporarily:

```json
"dependencies": {
  // Remove @juliaos/core dependency until it's published
}
```

#### Template String Issues

If you encounter issues with backticks in the generated TypeScript files, make sure they are correctly escaped. The files should use proper template literals like:

```typescript
console.log(`Agent ${this.name} starting...`);
```

You can customize this structure based on your specific needs.

### Framework Usage

```typescript
import { JuliaOS, Agent, Swarm } from '@juliaos/core';
import { MarketDataService } from '@juliaos/protocols';
import { MetaMaskWalletAdapter } from '@juliaos/wallets-metamask';

// Initialize wallet and connect
const wallet = new MetaMaskWalletAdapter();
await wallet.connect();

// Set up market data service with Chainlink feeds
const marketData = new MarketDataService(provider, {
  chainlinkFeeds: {
    // ETH/USD price feed address
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  },
  updateInterval: 30000 // 30 seconds
});

// Create custom trading agent
class CrossChainArbitrageAgent extends Agent {
  async initialize() {
    // Connect to multiple chains
    await this.connectChains(['ethereum', 'solana']);
    
    // Subscribe to price updates
    marketData.on('update', this.onPriceUpdate.bind(this));
  }
  
  async onPriceUpdate(data) {
    // Analyze for arbitrage opportunities
    const opportunities = await this.findArbitrageOpportunities(data);
    if (opportunities.length > 0) {
      await this.executeTrade(opportunities[0]);
    }
  }
}

// Create and start a swarm of agents
const swarm = new Swarm([
  new CrossChainArbitrageAgent()
]);
await swarm.start();
```

## Architecture

```
packages/
├── protocols/
│   ├── src/
│   │   ├── dex/
│   │   │   ├── chains/           # Chain-specific implementations
│   │   │   │   ├── ethereum/
│   │   │   │   ├── base/
│   │   │   │   └── solana/
│   │   │   │   └── services/     # Core services
│   │   │   └── types/           # Shared types
│   │   └── scripts/             # Utility scripts
```

## Documentation

### Getting Started
- [Quick Start Guide](docs/getting-started/quick-start.md)
- [Installation Guide](docs/getting-started/installation.md)
- [Basic Concepts](docs/getting-started/basic-concepts.md)

### Framework Documentation
- [Framework Guide](docs/framework/guide.md)
- [API Reference](docs/framework/api.md)
- [Architecture Overview](docs/framework/architecture.md)
- [Component Guide](docs/framework/components.md)

### CLI Documentation
- [CLI Guide](docs/cli/guide.md)
- [Command Reference](docs/cli/commands.md)
  - `j3os init [project-name]` - Create a new JuliaOS project
  - `j3os create` - Create a new component (agent, skill, connector)
  - `j3os version` - Display the CLI version information
  - `j3os help` - Show help information for all commands
- [Configuration Guide](docs/cli/configuration.md)

### Examples
- [Simple Agent Example](docs/examples/simple-agent.md)
- [Trading Swarm Example](docs/examples/trading-swarm.md)
- [CLI Trading Swarm Guide](docs/examples/cli-trading.md)
- [Advanced Examples](docs/examples/advanced.md)

### Advanced Topics
- [Security Best Practices](docs/advanced/security.md)
- [Performance Optimization](docs/advanced/performance.md)
- [Deployment Guide](docs/advanced/deployment.md)
- [Testing Guide](docs/advanced/testing.md)
- [Troubleshooting](docs/advanced/troubleshooting.md)

## Configuration

### Chain-Specific Settings
- **Ethereum**: Optimized for mainnet operations
- **Base**: L2-specific optimizations
- **Solana**: High-frequency trading parameters

### Risk Parameters
- Maximum position sizes
- Cross-chain exposure limits
- Drawdown controls
- Daily loss limits

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Community

- [GitHub Discussions](coming soon)
- [Medium](Coming soon)
- [Twitter](https://twitter.com/BuildOnJulia

## Support

- Documentation: [docs.juliaos.dev](coming soon)
- Issues: [GitHub Issues](https://github.com/juliaos/framework/issues)
- Email: support@juliaos.dev

## Directory Structure

The JuliaOS Framework follows a clean, organized directory structure:

```
/
├── packages/                # Shared packages (monorepo)
│   ├── core/                # Core framework
│   ├── protocols/           # Blockchain protocols
│   ├── agents/              # Agent implementations
│   ├── wallets/             # Wallet integrations 
│   ├── platforms/           # Platform integrations
│   └── ...                  # Other packages
│
├── contracts/               # Smart contracts
│   ├── ethereum/            # Ethereum contracts
│   ├── solana/              # Solana contracts
│   └── README.md            # Contracts documentation
│
├── bridges/                 # Bridge implementations
│   ├── relay/               # Relay service
│   ├── solana-bridge/       # Solana bridge
│   ├── ethereum-bridge/     # Ethereum bridge
│   └── README.md            # Bridge documentation
│
├── julia/                   # Julia code
│   ├── src/                 # Julia source code
│   ├── test/                # Julia tests
│   ├── examples/            # Julia examples
│   └── README.md            # Julia documentation
│
├── tests/                   # Tests
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── contracts/           # Contract tests
│   ├── e2e/                 # End-to-end tests
│   └── README.md            # Testing documentation
│
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── guides/              # User guides
│   └── architecture/        # Architecture documentation
│
├── scripts/                 # Utility scripts
│   ├── deploy/              # Deployment scripts
│   ├── dev/                 # Development scripts
│   └── utilities/           # Utility scripts
│
├── config/                  # Configuration files
│   ├── default.env          # Default environment variables
│   ├── tsconfig.base.json   # Base TypeScript configuration
│   └── README.md            # Configuration documentation
│
└── cli/                     # Command-line interface
    ├── j3os.ps1             # PowerShell implementation
    └── j3os.sh              # Bash implementation
```

For more detailed information about the repository structure, see [STRUCTURE.md](STRUCTURE.md).