# CLI Guide

This guide provides detailed information about using the JuliaOS CLI for managing and deploying trading systems.

## Installation

```bash
npm install -g @juliaos/cli
```

## Basic Commands

### Project Management

```bash
# Create a new project
juliaos init my-project

# Start development server
juliaos dev

# Start trading system
juliaos start

# Stop trading system
juliaos stop
```

### Configuration

```bash
# Configure environment variables
juliaos config env

# Configure network connections
juliaos config network

# Configure trading parameters
juliaos config trading

# Configure risk management
juliaos config risk
```

### Monitoring

```bash
# View logs
juliaos logs

# Monitor performance
juliaos monitor

# View agent status
juliaos status
```

### Trading Operations

```bash
# Execute trade
juliaos trade --token SOL/USDC --amount 1.5 --type buy

# Close position
juliaos close --token SOL/USDC

# View positions
juliaos positions
```

## Configuration Files

### Environment Variables (.env)

```env
# Network RPC URLs
ETHEREUM_RPC_URL=your_alchemy_url
BASE_RPC_URL=your_base_url
SOLANA_RPC_URL=your_solana_url

# API Keys
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key

# Trading Parameters
MAX_POSITION_SIZE=1.0
STOP_LOSS_PERCENTAGE=5
TAKE_PROFIT_PERCENTAGE=10
```

### Trading Configuration (trading.config.json)

```json
{
  "strategies": {
    "momentum": {
      "enabled": true,
      "parameters": {
        "momentumThreshold": 0.05,
        "volumeThreshold": 0.1
      }
    },
    "meanReversion": {
      "enabled": true,
      "parameters": {
        "deviationThreshold": 0.02
      }
    }
  },
  "riskManagement": {
    "maxDrawdown": 0.1,
    "dailyLossLimit": 0.05
  }
}
```

### Network Configuration (network.config.json)

```json
{
  "ethereum": {
    "enabled": true,
    "priority": 2,
    "maxGasPrice": "50"
  },
  "base": {
    "enabled": true,
    "priority": 1,
    "maxGasPrice": "0.1"
  },
  "solana": {
    "enabled": true,
    "priority": 3,
    "maxPriorityFee": "1000"
  }
}
```

## Project Structure

```
my-project/
├── src/
│   ├── agents/           # Custom trading agents
│   ├── swarms/           # Swarm configurations
│   └── strategies/       # Trading strategies
├── config/              # Configuration files
├── tests/               # Test files
└── package.json         # Project dependencies
```

## Development Workflow

1. **Initialize Project**
   ```bash
   juliaos init my-project
   cd my-project
   ```

2. **Configure Environment**
   ```bash
   juliaos config env
   ```

3. **Start Development**
   ```bash
   juliaos dev
   ```

4. **Deploy to Production**
   ```bash
   juliaos deploy
   ```

## Monitoring and Debugging

### Logs

```bash
# View all logs
juliaos logs

# View error logs
juliaos logs --level error

# View specific agent logs
juliaos logs --agent agent-1
```

### Performance Monitoring

```bash
# View system metrics
juliaos monitor

# View specific metrics
juliaos monitor --metric pnl

# Export metrics
juliaos monitor --export metrics.csv
```

## Security

### API Key Management

```bash
# Add API key
juliaos config api-key add --service alchemy --key your_key

# List API keys
juliaos config api-key list

# Remove API key
juliaos config api-key remove --service alchemy
```

### Wallet Management

```bash
# Add wallet
juliaos config wallet add --address 0x...

# List wallets
juliaos config wallet list

# Remove wallet
juliaos config wallet remove --address 0x...
```

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify RPC URLs in `.env`
   - Check network connectivity
   - Validate API keys

2. **Performance Issues**
   - Monitor system resources
   - Check log levels
   - Optimize configuration

3. **Trading Issues**
   - Verify wallet balances
   - Check slippage settings
   - Review position limits

## Next Steps

1. Read the [Command Reference](commands.md) for detailed command documentation
2. Explore the [Configuration Guide](configuration.md) for advanced settings
3. Check out the [Examples](../examples/) section for practical use cases
4. Review [Security Best Practices](../advanced/security.md) for production deployment 