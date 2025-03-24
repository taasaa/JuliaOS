# JuliaOS CLI

A powerful command-line interface for the JuliaOS framework, providing tools to create, manage, and monitor AI-powered trading agents and swarms.

## Features

- **Interactive Mode**: User-friendly interface for creating and managing agents
- **Rich Terminal UI**: Color-coded status displays and progress indicators
- **Real-time Monitoring**: Live monitoring of agent performance and market data
- **Comprehensive Commands**: Full suite of commands for agent and swarm management
- **Error Handling**: Clear error messages and stack traces
- **Configuration Management**: Easy configuration of agents and swarms

## Installation

1. Clone the repository:
```bash
git clone https://github.com/juliaos/framework.git
cd framework
```

2. Install dependencies:
```bash
julia --project=. -e 'using Pkg; Pkg.instantiate()'
```

3. Make the CLI executable:
```bash
chmod +x juliaos.jl
```

## Usage

### Interactive Mode

Launch the interactive mode:
```bash
./juliaos.jl interactive
```

This will start an interactive session where you can:
- Create new agents and swarms
- Monitor active agents
- View market data
- Manage bridge operations

### Command Line Mode

#### Dashboard
```bash
./juliaos.jl dashboard [--host HOST] [--port PORT]
```

#### Backtest
```bash
./juliaos.jl backtest --strategy STRATEGY --start-date YYYY-MM-DD --end-date YYYY-MM-DD --initial-capital AMOUNT --pairs PAIR1 PAIR2 ...
```

#### Optimize
```bash
./juliaos.jl optimize --algorithm ALGO --iterations N --population-size N --parameters PARAM1 PARAM2 ...
```

#### Market Data
```bash
./juliaos.jl market --pair PAIR --timeframe TIMEFRAME --limit N
```

#### Project Scaffolding
```bash
./juliaos.jl scaffold --name NAME --type TYPE
```

### Examples

1. Create a new arbitrage agent:
```bash
./juliaos.jl interactive
# Select "Create New Agent"
# Choose "Arbitrage Agent"
# Configure parameters
```

2. Run a backtest:
```bash
./juliaos.jl backtest \
  --strategy "Momentum" \
  --start-date "2023-01-01" \
  --end-date "2023-12-31" \
  --initial-capital 10000 \
  --pairs "ETH/USDC" "BTC/USDC"
```

3. Monitor market data:
```bash
./juliaos.jl market \
  --pair "ETH/USDC" \
  --timeframe "1h" \
  --limit 100
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:
```env
# API Configuration
API_ENDPOINT=http://localhost:3000

# Network Configuration
ETH_RPC_URL=https://eth-mainnet.example.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Security
API_KEY=your_api_key
```

### Agent Configuration

Agents can be configured through:
1. Interactive mode
2. Configuration files
3. Command-line arguments

Example agent configuration:
```json
{
  "name": "arbitrage_agent_1",
  "type": "Arbitrage Agent",
  "strategy": "Momentum",
  "chains": ["Ethereum", "Solana"],
  "risk_params": {
    "max_position_size": 0.1,
    "min_profit_threshold": 0.02,
    "max_gas_price": 100.0,
    "confidence_threshold": 0.8
  }
}
```

## Development

### Adding New Commands

1. Add command definition in `apps/cli.jl`:
```julia
@add_arg_table! s begin
    "new-command"
        help = "Description of the new command"
        action = :command
end
```

2. Add command implementation:
```julia
function cmd_new_command(args)
    # Implementation
end
```

3. Update main function:
```julia
if args["%COMMAND%"] == "new-command"
    cmd_new_command(args["new-command"])
end
```

### Testing

Run tests:
```bash
julia --project=test test/runtests.jl
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 