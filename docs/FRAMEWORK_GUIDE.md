# JuliaOS Framework Development Guide

A comprehensive guide for developers who want to contribute to or build upon the JuliaOS Framework.

## Architecture Overview

### Core Components

```
JuliaOS Framework
├── packages/
│   ├── cli/          # Command-line interface
│   ├── agents/       # Agent core functionality
│   ├── skills/       # Skill system
│   ├── connectors/   # Platform connectors
│   ├── core/         # Core utilities
│   ├── marketplace/  # Component marketplace
│   ├── chains/       # Cross-chain bridge functionality
│   ├── storage/      # Decentralized storage options
│   └── protocols/    # Communication protocols
```

### Key Concepts

1. **Agents**
   - Autonomous entities
   - Can have multiple skills
   - Platform-agnostic
   - Event-driven

2. **Skills**
   - Reusable capabilities
   - Pluggable into agents
   - Version controlled
   - Testable units

3. **Connectors**
   - Platform integrations
   - Event handling
   - Message formatting
   - Authentication

4. **Cross-Chain Bridge**
   - Token transfer between blockchains
   - Transaction tracking
   - Multi-chain support
   - Secure message verification

5. **Marketplace**
   - Module publishing and distribution
   - Decentralized payments
   - Reputation system
   - License management

6. **LLM Integration**
   - Multiple provider support (OpenAI, Anthropic)
   - Streaming capabilities
   - Provider-agnostic interface
   - Context management

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- TypeScript (v4 or later)
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Juliaoscode/JuliaOSframework.git
cd JuliaOSframework

# Install dependencies
npm install

# Build all packages
npm run build

# Link for local development
npm link
```

### Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/my-feature
```

2. Run tests:
```bash
npm test
```

3. Build packages:
```bash
npm run build
```

## Package Development

### Creating a New Package

1. Create package directory:
```bash
mkdir packages/my-package
cd packages/my-package
```

2. Initialize package:
```bash
npm init
```

3. Add to workspace:
```json
// In root package.json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### Package Structure

```
my-package/
├── src/
│   ├── index.ts         # Main entry point
│   ├── types.ts         # Type definitions
│   └── __tests__/       # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Creating Components

### Implementing an Agent

```typescript
import { BaseAgent } from '@juliaos/agents';

export class MyAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // Setup code
  }

  async processMessage(message: Message): Promise<void> {
    // Message handling
  }
}
```

### Creating a Skill

```typescript
import { BaseSkill } from '@juliaos/skills';

export class MySkill extends BaseSkill {
  async execute(context: SkillContext): Promise<SkillResult> {
    // Skill implementation
    return result;
  }
}
```

### Building a Connector

```typescript
import { BaseConnector } from '@juliaos/connectors';

export class MyConnector extends BaseConnector {
  async connect(): Promise<void> {
    // Connection logic
  }

  async sendMessage(message: Message): Promise<void> {
    // Message sending logic
  }
}
```

## Testing

### Unit Tests

```typescript
import { MyAgent } from '../my-agent';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent(config);
  });

  it('should process messages', async () => {
    const result = await agent.processMessage(message);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { TestEnvironment } from '@juliaos/testing';

describe('Integration', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await TestEnvironment.create();
  });

  it('should work end-to-end', async () => {
    const result = await env.runScenario(scenario);
    expect(result).toMatchExpectedOutput();
  });
});
```

### Testing Trading Components

#### Portfolio Management Testing

```typescript
import { JuliaSwarm } from '@juliaos/julia-swarm';

describe('Portfolio Management', () => {
  let swarm: JuliaSwarm;

  beforeEach(async () => {
    swarm = new JuliaSwarm({
      testMode: true,
      trading_pairs: ['SOL/USDC']
    });
    await swarm.initialize();
  });

  it('should calculate portfolio balances correctly', async () => {
    const trade = {
      pair: 'SOL/USDC',
      type: 'buy',
      amount: 0.1
    };

    await swarm.executeTrade(trade);
    const portfolio = await swarm.getPortfolio();

    expect(portfolio.balances['SOL']).toBe(0.1);
    expect(portfolio.balances['USDC']).toBe(9900); // Assuming 100 USDC initial balance
    expect(portfolio.totalValue).toBe(10000); // Total value in USDC
  });

  it('should validate trades correctly', async () => {
    const trade = {
      pair: 'SOL/USDC',
      type: 'buy',
      amount: 1000 // Exceeds available balance
    };

    await expect(swarm.executeTrade(trade)).rejects.toThrow('InsufficientBalanceError');
  });
});
```

#### WebSocket Mock Testing

```typescript
describe('WebSocket Integration', () => {
  let swarm: JuliaSwarm;
  let mockWs: MockWebSocket;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    swarm = new JuliaSwarm({
      testMode: true,
      trading_pairs: ['SOL/USDC']
    });
    await swarm.initialize();
    mockWs = swarm.ws as MockWebSocket;
  });

  it('should handle market data updates', async () => {
    const marketData = {
      type: 'market_data',
      data: {
        'SOL/USDC': {
          price: 100,
          volume: 1000000
        }
      }
    };

    mockWs.emit('message', JSON.stringify(marketData));
    const portfolio = await swarm.getPortfolio();
    expect(portfolio.marketData['SOL/USDC'].price).toBe(100);
  });

  it('should handle WebSocket errors', async () => {
    const error = new Error('Connection failed');
    mockWs.emit('error', error);
    
    // Verify error handling
    expect(swarm.errorHandler).toHaveBeenCalledWith(error);
  });
});
```

### Test Configuration

```typescript
interface TestConfig {
  testMode: boolean;        // Enable test mode
  testError?: boolean;      // Simulate errors
  mockMarketData?: {        // Mock market data
    [pair: string]: {
      price: number;
      volume: number;
    }
  }
}

// Example test configuration
const testConfig: TestConfig = {
  testMode: true,
  testError: false,
  mockMarketData: {
    'SOL/USDC': {
      price: 100,
      volume: 1000000
    }
  }
};
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/portfolio.test.ts

# Run tests in test environment
NODE_ENV=test npm test
```

### Test Best Practices

1. **Portfolio Testing**
   - Always verify both individual balances and total value
   - Test edge cases (zero balances, maximum positions)
   - Verify atomic updates to prevent inconsistencies
   - Test error conditions and validation

2. **WebSocket Testing**
   - Use mock WebSocket for predictable testing
   - Test both success and error scenarios
   - Verify message handling and data updates
   - Test reconnection logic
   - Validate error handling

3. **Trade Validation**
   - Test all validation rules
   - Verify error messages
   - Test market condition checks
   - Validate position limits
   - Test balance requirements

4. **Error Handling**
   - Test all error scenarios
   - Verify error messages
   - Test recovery mechanisms
   - Validate error propagation

## Building Extensions

### Custom Agent Behaviors

```typescript
import { AgentBehavior } from '@juliaos/agents';

export class MyBehavior implements AgentBehavior {
  async apply(agent: BaseAgent): Promise<void> {
    // Implement behavior
  }
}
```

### Platform Integration

```typescript
import { PlatformAdapter } from '@juliaos/core';

export class MyPlatform extends PlatformAdapter {
  async initialize(): Promise<void> {
    // Platform setup
  }

  async handleEvent(event: PlatformEvent): Promise<void> {
    // Event handling
  }
}
```

## Deployment

### Package Publishing

```bash
# Build package
npm run build

# Publish to npm
npm publish
```

### Version Management

```bash
# Update version
npm version patch|minor|major

# Push tags
git push --tags
```

## Best Practices

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document public APIs

### Performance

- Implement proper error handling
- Use async/await consistently
- Cache expensive operations
- Profile memory usage

### Security

- Never commit secrets
- Validate all inputs
- Use proper authentication
- Follow security best practices

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests
4. Update documentation
5. Submit a pull request

## Additional Resources

- [API Reference](API_REFERENCE.md)
- [CLI Guide](CLI_GUIDE.md)
- [Examples](../examples/)
- [Contributing Guide](../CONTRIBUTING.md)

## Feature Implementations

### Cross-Chain Bridge Usage

The cross-chain bridge allows seamless token transfers between different blockchains.

#### Example: Sending tokens from Ethereum to Base

```typescript
import { EthereumBridgeProvider } from '@juliaos/chains/bridge';
import { ChainId } from '@juliaos/chains/types';
import { ethers } from 'ethers';

async function bridgeTokens() {
  // Setup provider
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');
  const signer = new ethers.Wallet('PRIVATE_KEY', provider);
  
  // Configure bridge
  const configs = [{
    sourceChainId: ChainId.ETHEREUM_MAINNET,
    targetChainId: ChainId.BASE_MAINNET,
    sourceTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI on Ethereum
    targetTokenAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI on Base
    bridgeContractAddress: '0x4200000000000000000000000000000000000010', // Example bridge address
    minAmount: ethers.parseUnits('10', 18),
    maxAmount: ethers.parseUnits('1000', 18),
    fees: {
      percentage: 0.1, // 0.1%
      fixed: ethers.parseUnits('1', 18)
    }
  }];
  
  const providerUrls = new Map([
    [ChainId.ETHEREUM_MAINNET, 'https://mainnet.infura.io/v3/YOUR_KEY'],
    [ChainId.BASE_MAINNET, 'https://mainnet.base.org']
  ]);
  
  const bridge = new EthereumBridgeProvider(configs, providerUrls, signer);
  
  // Initiate bridge transaction
  const tx = await bridge.initiate(
    ChainId.ETHEREUM_MAINNET,
    ChainId.BASE_MAINNET,
    ethers.parseUnits('50', 18),
    '0xRecipientAddress'
  );
  
  console.log(`Bridge initiated: ${tx.id}`);
  console.log(`Status: ${tx.status}`);
  
  // Check status later
  const updatedTx = await bridge.confirm(tx.id);
  console.log(`Bridge completed: ${updatedTx.status}`);
}
```

### Marketplace Integration

The marketplace allows developers to publish and monetize modules.

#### Example: Publishing a Module

```typescript
import { ethers } from 'ethers';
import { MarketplaceClient } from '@juliaos/marketplace';

async function publishAgentModule() {
  // Setup provider
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const signer = new ethers.Wallet('PRIVATE_KEY', provider);
  
  // Connect to marketplace
  const marketplace = new MarketplaceClient(
    '0xMarketplaceContractAddress',
    provider.connect(signer)
  );
  
  // Publish a module
  const tx = await marketplace.publishModule(
    'Premium Coding Assistant',
    'An advanced AI agent specialized in code review and refactoring',
    ethers.parseEther('0.05') // 0.05 ETH
  );
  
  console.log(`Module published, transaction: ${tx.hash}`);
  
  // Wait for confirmation
  await tx.wait();
  console.log('Publication confirmed!');
}
```

### LLM Integration

The LLM integration allows agents to use different language models.

#### Example: Using OpenAI and Anthropic Models

```typescript
import { LLMFactory } from '@juliaos/core/llm/factory';
import { Message } from '@juliaos/core/llm/provider';

async function useMultipleLLMs() {
  // Create providers
  const factory = new LLMFactory();
  
  // Initialize OpenAI provider
  const openai = await factory.createProvider('openai', {
    apiKey: 'OPENAI_API_KEY',
    model: 'gpt-4',
    temperature: 0.7
  });
  
  // Initialize Anthropic provider
  const anthropic = await factory.createProvider('anthropic', {
    apiKey: 'ANTHROPIC_API_KEY',
    model: 'claude-3-opus-20240229',
    temperature: 0.5
  });
  
  // Create messages
  const messages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ];
  
  // Get completions from both providers
  const openaiResponse = await openai.complete(messages);
  console.log('OpenAI Response:', openaiResponse.content);
  
  const anthropicResponse = await anthropic.complete(messages);
  console.log('Anthropic Response:', anthropicResponse.content);
  
  // Stream response
  console.log('Streaming response:');
  for await (const chunk of openai.streamComplete(messages)) {
    process.stdout.write(chunk);
  }
}
```
