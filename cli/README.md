# JuliaOS CLI

This directory contains the implementation of the JuliaOS Command Line Interface (`j3os`), which provides tools for creating and managing AI-powered trading agents and swarms.

## Files

- `j3os.ps1` - PowerShell implementation for Windows
- `j3os.sh` - Bash implementation for Mac/Linux

## Usage

The CLI can be used in two ways:

1. **Through npm** - The CLI is published to npm as `@juliaos/cli` and can be installed globally:
   ```bash
   npm install -g @juliaos/cli
   j3os init my-project
   ```

2. **From Repository** - The CLI is designed to be used through the wrapper scripts in the root directory:
   - `j3os.bat` for Windows
   - `j3os.sh` for Mac/Linux 

## Available Commands

### Project Management

- `j3os init [project-name]` - Create a new JuliaOS project
- `j3os create -t <type> -n <name>` - Create a new component (agent, skill, connector)
- `j3os version` - Show version information
- `j3os help` - Show help information

### DeFi Trading

- `j3os defi` - Configure DeFi trading with swarm intelligence algorithms
  - Allows creating swarm-based or agent-based trading strategies
  - Configures algorithms, trading pairs, risk parameters, and more

### Julia Integration

- `j3os julia start` - Start the Julia server
  - `-p, --port <port>` - Specify the port (default: 3000)
  - `-d, --debug` - Enable debug mode
- `j3os julia stop` - Stop the Julia server
- `j3os julia install` - Install Julia packages
- `j3os julia run <script>` - Run a Julia script
- `j3os julia setup-bridge` - Set up the TypeScript-Julia bridge

### Monitoring

- `j3os monitor health` - Check system health
- `j3os monitor agents` - List active agents
- `j3os monitor swarms` - List active swarms
- `j3os monitor agent <id>` - Show detailed agent information
- `j3os monitor security` - Show security incidents
- `j3os monitor live` - Monitor system in real-time
  - `-i, --interval <seconds>` - Update interval (default: 5)

## Workflows

### Setting Up a New Project

```bash
# Create a new project
j3os init my-defi-project
cd my-defi-project

# Set up the Julia bridge
j3os julia setup-bridge

# Configure a trading strategy
j3os defi

# Start the Julia server
j3os julia start

# Monitor the system
j3os monitor live
```

### Working with Agents

```bash
# Create a new agent
j3os create -t agent -n MyTrader

# List all active agents
j3os monitor agents

# Get details about a specific agent
j3os monitor agent <agent-id>
```

## Development

When adding new commands, please update both:
1. The PowerShell implementation (`j3os.ps1`) for Windows users
2. The Bash implementation (`j3os.sh`) for Mac/Linux users

## Publishing

To publish a new version to npm:

1. Update the version number in `package.json`
2. Run `npm publish`

Make sure you have the necessary permissions to publish to the `@juliaos` scope. 