# JuliaOS CLI

A command-line interface for the JuliaOS framework, providing tools to create, manage, and deploy AI agents and components.

## Ways to Use JuliaOS

### 1. As a CLI Tool User

For developers who want to use the CLI to create and manage AI agents:

```bash
# Install the CLI globally
npm install -g @juliaos/cli

# Initialize a new project
julia init my-project
cd my-project

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Create and deploy components
julia create agent my-agent
julia deploy my-agent
```

### 2. As a Module User

For developers who want to use JuliaOS modules in their code:

```typescript
// Install required modules
npm install @juliaos/agents @juliaos/skills

// Using the agents module
import { Agent } from '@juliaos/agents';

const myAgent = new Agent({
    name: 'MyAgent',
    skills: ['reasoning', 'planning']
});

// Using the skills module
import { Skill } from '@juliaos/skills';

class MyCustomSkill extends Skill {
    async execute() {
        // Your skill implementation
    }
}
```

Available modules:
- `@juliaos/cli`: Core CLI functionality
- `@juliaos/agents`: Agent creation and management
- `@juliaos/skills`: Skill development toolkit
- `@juliaos/connectors`: Platform connectors

### 3. As a Framework Developer

For developers who want to contribute or modify the framework:

```bash
# Clone the repository
git clone https://github.com/Juliaoscode/JuliaOSframework.git
cd JuliaOSframework

# Install dependencies
npm install

# Set up environment variables
cp packages/cli/.env.example packages/cli/.env
# Edit .env with development configuration

# Build the CLI
npm run build

# Link it locally
npm link
```

## Installation

```bash
npm install -g @juliaos/cli
```

## Configuration

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
# API Configuration
API_ENDPOINT=http://localhost:3000

# Component Registry
REGISTRY_URL=https://registry.example.com

# Deployment Settings
DEPLOY_ENVIRONMENT=development
```

Required environment variables:
- `API_ENDPOINT`: Your JuliaOS API endpoint
- `REGISTRY_URL`: URL of the component registry
- `DEPLOY_ENVIRONMENT`: Deployment environment (development/staging/production)

Optional environment variables:
- `AUTH_TOKEN`: Authentication token (if required)
- `DEPLOY_KEY`: Deployment key for secure deployments
- `ANALYTICS_ENABLED`: Enable/disable analytics
- `ANALYTICS_KEY`: Analytics service key

### Security Considerations

1. Never commit your `.env` file
2. Keep your authentication tokens secure
3. Use different deployment keys for each environment
4. Regularly rotate your security keys
5. Follow the principle of least privilege when setting up permissions

## Usage

### Initialize a New Project

```bash
julia init
```

This will create a new JuliaOS project with the following structure:
```
my-julia-project/
├── src/
│   ├── agents/
│   ├── skills/
│   └── tests/
├── package.json
├── tsconfig.json
└── README.md
```

### Create a New Component

```bash
julia create <type>
```

Available component types:
- `agent`: Create a new AI agent
- `skill`: Create a new agent skill
- `connector`: Create a new platform connector

### Deploy a Component

```bash
julia deploy <n> [options]
```

Options:
- `-e, --env <environment>`: Deployment environment (default: "development")

### Run Tests

```bash
julia test <n> [options]
```

Options:
- `-w, --watch`: Watch mode for continuous testing

### Marketplace Commands

```bash
julia marketplace <action> [options]
```

Actions:
- `list`: List available components
- `install`: Install a component
- `publish`: Publish a component

Options:
- `-t, --type <type>`: Filter by component type

### Configuration Management

```bash
julia config <action> [options]
```

Actions:
- `list`: List all configuration
- `get`: Get a specific configuration value
- `set`: Set a configuration value

Options:
- `-k, --key <key>`: Configuration key
- `-v, --value <value>`: Configuration value

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- TypeScript (v4 or later)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/juliaos/framework.git
cd framework
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your development configuration
```

4. Build the CLI:
```bash
npm run build
```

5. Link the CLI locally:
```bash
npm link
```

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Security

When contributing, please:
- Never commit sensitive information
- Use environment variables for configuration
- Follow security best practices
- Report security vulnerabilities responsibly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 