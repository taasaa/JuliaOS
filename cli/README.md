# J3OS CLI

Command-line interface for the J3OS Framework, enabling cross-chain DeFi trading with AI-powered agents and swarms.

## Features

- **Cross-Chain Support**
  - Ethereum and EVM-compatible chains
  - Solana ecosystem
  - Custom network configurations
  - Multi-chain arbitrage capabilities

- **Wallet Integration**
  - MetaMask support
  - Phantom wallet support
  - Rabby multi-chain wallet
  - Custom RPC configurations

- **Trading Strategies**
  - Market making
  - Arbitrage
  - Cross-chain arbitrage
  - Custom strategy support

- **Execution Types**
  - Single agent execution
  - Swarm intelligence execution
  - Hybrid execution modes

- **Security Features**
  - Encrypted configuration storage
  - Secure file permissions
  - Environment variable management
  - Rate limiting for API calls

- **Monitoring & Logging**
  - Prometheus metrics integration
  - Winston logging system
  - Elasticsearch log aggregation
  - Health checks and alerts

## Installation

```bash
npm install -g @j3os/cli
```

## Quick Start

1. Initialize a new project:
```bash
j3os init
```

2. Configure DeFi trading:
```bash
j3os defi configure
```

3. Start trading:
```bash
j3os start
```

## Commands

### Project Management
- `j3os init` - Initialize a new J3OS project
- `j3os start` - Start the trading system
- `j3os stop` - Stop the trading system
- `j3os status` - Check system status

### DeFi Configuration
- `j3os defi configure` - Configure DeFi trading setup
- `j3os defi list` - List configured trading setups
- `j3os defi remove` - Remove a trading setup

### Wallet Management
- `j3os wallet add-network` - Add a new network
- `j3os wallet configure` - Configure wallet settings
- `j3os wallet backup` - Backup wallet configuration
- `j3os wallet restore` - Restore wallet configuration

### Monitoring
- `j3os monitor add` - Add a new monitoring rule
- `j3os monitor list` - List monitoring rules
- `j3os monitor remove` - Remove a monitoring rule
- `j3os monitor status` - Check monitoring status

## Configuration

### Environment Variables

Required:
```bash
WEB3_PROVIDER="https://your-rpc-url"
API_KEY="your-api-key"
WALLET_PRIVATE_KEY="your-private-key"
```

Optional:
```bash
ELASTICSEARCH_URL="https://your-elasticsearch-url"  # For logging
LOG_LEVEL="info"  # For logging level
```

### Project Structure

```
j3os-project/
├── config/
│   ├── agent.json
│   └── swarm.json
├── julia/
│   ├── src/
│   │   ├── agents/
│   │   └── swarms/
│   └── tests/
├── logs/
│   ├── error.log
│   └── combined.log
└── backups/
    └── metrics.json
```

## Development

### Prerequisites
- Node.js >= 14
- Julia >= 1.6
- npm or yarn

### Setup
```bash
# Clone repository
git clone https://github.com/j3os/framework.git
cd framework

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Running Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests (requires network access)
RUN_E2E=true npm run test:e2e
```

## Security

- Never share private keys
- Use environment variables for sensitive data
- Regularly backup configurations
- Monitor for suspicious activity
- Test on testnet first

## Monitoring

The CLI includes comprehensive monitoring capabilities:

- Transaction monitoring
- Balance tracking
- Performance metrics
- Health checks
- Alert system

Access metrics at `/metrics` endpoint when running in server mode.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs.j3os.io](https://docs.j3os.io)
- Discord: [J3OS Community](https://discord.gg/j3os)
- GitHub Issues: [J3OS Framework](https://github.com/j3os/framework/issues) 