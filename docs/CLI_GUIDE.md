# JuliaOS CLI Guide

A comprehensive guide for using the JuliaOS Command Line Interface.

## Installation

```bash
# Install specific version (recommended)
npm install -g @juliaos/cli@0.1.4

# Or install latest version
npm install -g @juliaos/cli

# Verify installation
j3os --version
```

## Project Setup

### Initialize a New Project

```bash
j3os init my-project
cd my-project
```

This creates a new project with the following structure:
```
my-project/
├── src/
│   ├── index.ts        # Main entry point
│   ├── agents/         # Your AI agents
│   ├── skills/         # Custom skills
│   └── tests/          # Test files
├── jest.config.js      # Jest configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies
├── .gitignore         # Git ignore rules
└── README.md          # Project documentation
```

### Development Commands

```bash
# Start development with auto-reload
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Start the built project
npm start
```

### TypeScript Configuration

The project comes with a pre-configured `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Jest Configuration

Testing is configured with Jest and ts-jest:

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
# API Configuration
API_ENDPOINT=http://localhost:3000

# Component Registry
REGISTRY_URL=https://registry.example.com

# Deployment Settings
DEPLOY_ENVIRONMENT=development
```

## Creating Components

### Create an Agent

```bash
j3os create agent my-agent
```

This creates:
- Agent implementation file
- Test file
- Type definitions
- Basic configuration

### Create a Skill

```bash
j3os create skill text-analysis
```

Skills are reusable capabilities that can be added to agents.

### Create a Connector

```bash
j3os create connector discord
```

Connectors enable platform integration (Discord, Slack, etc.).

## Testing

### Run Tests

```bash
# Run all tests
j3os test

# Run specific tests
j3os test my-agent

# Watch mode
j3os test --watch

# Run tests with coverage
j3os test --coverage

# Run tests in test mode
NODE_ENV=test j3os test
```

### Test Configuration

Create a `test.config.json` file:
```json
{
  "testMode": true,
  "testError": false,
  "mockMarketData": {
    "SOL/USDC": {
      "price": 100,
      "volume": 1000000
    }
  }
}
```

### Testing Trading Components

```bash
# Test portfolio management
j3os test portfolio

# Test trade validation
j3os test validation

# Test WebSocket integration
j3os test websocket

# Test error handling
j3os test errors
```

### Error Handling

The CLI provides comprehensive error handling:

1. **Validation Errors**
   ```bash
   # Check for validation errors
   j3os validate my-agent
   ```

2. **Test Mode Errors**
   ```bash
   # Simulate errors in test mode
   NODE_ENV=test j3os test --error
   ```

3. **Portfolio Errors**
   ```bash
   # Check portfolio balance errors
   j3os portfolio check
   ```

4. **WebSocket Errors**
   ```bash
   # Test WebSocket connection
   j3os websocket test
   ```

### Error Logging

```bash
# View error logs
j3os logs --type error

# Filter by component
j3os logs --component my-agent --type error

# Export error logs
j3os logs --type error --export errors.json
```

### Portfolio Management

```bash
# Initialize portfolio
j3os portfolio init

# Add trading pair
j3os portfolio add-pair SOL/USDC

# Set risk parameters
j3os portfolio set-risk --max-position 1.0 --stop-loss 5.0

# View portfolio status
j3os portfolio status

# Export portfolio data
j3os portfolio export --format json
```

### WebSocket Management

```bash
# Start WebSocket connection
j3os websocket start

# Monitor WebSocket status
j3os websocket status

# Test WebSocket connection
j3os websocket test

# View WebSocket logs
j3os websocket logs
```

## Deployment

### Deploy a Component

```