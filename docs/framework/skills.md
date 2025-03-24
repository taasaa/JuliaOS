# Skills Module Guide

A comprehensive guide for developers who want to use and create skills in the JuliaOS Framework.

## Overview

Skills are pluggable, reusable components that provide specific capabilities to agents. They encapsulate functionality like web browsing, mathematical calculations, database interactions, or specialized tools like DeFi trading. By using skills, you can extend agent capabilities without modifying the agent core code.

## Key Concepts

- **Modularity**: Skills are self-contained units that can be added to or removed from agents.
- **Lifecycle**: Skills follow a simple lifecycle of initialization, execution, and cleanup.
- **Event-driven**: Skills emit events to notify agents of state changes or results.
- **Configurable**: Skills can be configured using parameters.

## Skill Lifecycle

1. **Initialization**: Set up resources and connections needed by the skill.
2. **Execution**: Perform the skill's core functionality when triggered.
3. **Stopping**: Clean up resources and connections when the skill is no longer needed.

## Using Existing Skills

### Importing Skills

```typescript
import { EchoSkill, DeFiTradingSkill } from '@juliaos/core/skills';
```

### Creating a Skill Instance

```typescript
const echoSkill = new EchoSkill({
  name: 'echo-1',
  type: 'utility',
  prefix: 'Bot: ',
  parameters: {
    maxLength: 100
  }
});
```

### Initializing a Skill

```typescript
await echoSkill.initialize();
```

### Using a Skill

```typescript
// For EchoSkill
echoSkill.setInput('Hello, world!');
await echoSkill.execute();

// Get results through events
echoSkill.on('executionComplete', (data) => {
  console.log(`Result: ${data.result}`);
});
```

### Stopping a Skill

```typescript
await echoSkill.stop();
```

## Creating Custom Skills

### Basic Skill Template

```typescript
import { Skill, SkillConfig } from '@juliaos/core/skills';

// Define your skill configuration
export interface MyCustomSkillConfig extends SkillConfig {
  customOption?: string;
}

// Implement your skill
export class MyCustomSkill extends Skill {
  private customOption: string;

  constructor(config: MyCustomSkillConfig) {
    super(config.parameters || {}, config.name, config.type);
    this.customOption = config.customOption || 'default';
  }

  async initialize(): Promise<void> {
    try {
      // Initialize your skill
      // For example, set up connections, load resources, etc.
      
      this.setInitialized(true);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async execute(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Skill not initialized');
    }
    
    try {
      this.setRunning(true);
      this.updateExecutionTime();
      
      // Your implementation goes here
      const result = "Your skill's result";
      
      // Emit event with results
      this.emit('executionComplete', { result, timestamp: Date.now() });
      
      this.setRunning(false);
    } catch (error) {
      this.handleError(error as Error);
      this.setRunning(false);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      // Clean up resources
      this.setRunning(false);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }
}
```

### Skill Events

Skills can emit various events to communicate with agents:

- **'initialized'**: Emitted when the skill is initialized.
- **'started'**: Emitted when the skill execution begins.
- **'stopped'**: Emitted when the skill execution stops.
- **'error'**: Emitted when an error occurs.
- **Custom events**: Skills can define their own events for specific functionality.

Example of handling events:

```typescript
mySkill.on('initialized', () => console.log('Skill initialized'));
mySkill.on('started', () => console.log('Skill execution started'));
mySkill.on('stopped', () => console.log('Skill execution stopped'));
mySkill.on('error', (error) => console.error('Skill error:', error));
mySkill.on('executionComplete', (data) => console.log('Result:', data.result));
```

## Advanced Skill Development

### Skill Dependencies

If your skill depends on external services or libraries, initialize them in the `initialize` method and clean them up in the `stop` method.

```typescript
async initialize(): Promise<void> {
  try {
    // Initialize external dependencies
    this.externalClient = new ExternalServiceClient({
      apiKey: this.parameters.apiKey,
      endpoint: this.parameters.endpoint
    });
    
    await this.externalClient.connect();
    this.setInitialized(true);
  } catch (error) {
    this.handleError(error as Error);
    throw error;
  }
}

async stop(): Promise<void> {
  try {
    // Clean up external dependencies
    if (this.externalClient) {
      await this.externalClient.disconnect();
    }
    this.setRunning(false);
  } catch (error) {
    this.handleError(error as Error);
    throw error;
  }
}
```

### Async Skill Execution

For long-running operations, consider using a promise-based approach:

```typescript
async execute(): Promise<void> {
  if (!this.isInitialized) {
    throw new Error('Skill not initialized');
  }
  
  try {
    this.setRunning(true);
    this.updateExecutionTime();
    
    // Start a long-running operation
    const operation = this.externalClient.startOperation();
    
    // Emit progress events
    operation.on('progress', (progress) => {
      this.emit('progress', { percent: progress.percent });
    });
    
    // Wait for completion
    const result = await operation.completion;
    
    // Emit event with results
    this.emit('executionComplete', { result, timestamp: Date.now() });
    
    this.setRunning(false);
  } catch (error) {
    this.handleError(error as Error);
    this.setRunning(false);
    throw error;
  }
}
```

### Integrating with LLMs

For skills that need LLM capabilities:

```typescript
import { LLMProvider } from '@juliaos/core/llm';

export interface LLMSkillConfig extends SkillConfig {
  llmConfig?: {
    provider: string;
    model: string;
    apiKey?: string;
  };
}

export class LLMPoweredSkill extends Skill {
  private llm?: LLMProvider;
  
  constructor(config: LLMSkillConfig) {
    super(config.parameters || {}, config.name, config.type);
    
    // Store LLM config
    if (config.llmConfig) {
      this.parameters.llmConfig = config.llmConfig;
    }
  }
  
  async initialize(): Promise<void> {
    try {
      // Initialize LLM if configured
      if (this.parameters.llmConfig) {
        this.llm = new LLMProvider();
        await this.llm.initialize(this.parameters.llmConfig);
      }
      
      this.setInitialized(true);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }
  
  async execute(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Skill not initialized');
    }
    
    try {
      this.setRunning(true);
      
      if (!this.llm) {
        throw new Error('LLM not initialized');
      }
      
      const prompt = "Your prompt here";
      const response = await this.llm.generate(prompt);
      
      this.emit('executionComplete', {
        result: response.text,
        timestamp: Date.now()
      });
      
      this.setRunning(false);
    } catch (error) {
      this.handleError(error as Error);
      this.setRunning(false);
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    this.setRunning(false);
  }
}
```

## Best Practices

1. **Handle errors properly**: Use try-catch blocks in your methods and emit errors using `this.handleError()`.
2. **Clean up resources**: Always clean up resources in the `stop` method.
3. **Use events for communication**: Emit events to communicate with agents.
4. **Keep skills focused**: Each skill should have a specific, well-defined purpose.
5. **Make skills configurable**: Allow skills to be configured using parameters.
6. **Update execution times**: Use `this.updateExecutionTime()` to track when the skill was last executed.
7. **Document your skill**: Provide clear documentation for your skill, including its purpose, configuration options, and events.

## Available Skills

| Skill | Description | Configuration Options |
|-------|-------------|----------------------|
| `EchoSkill` | Simple skill that echoes input text | `prefix`: String to prefix output with |
| `DeFiTradingSkill` | Advanced skill for DeFi trading | See `DeFiTradingConfig` interface |

## Examples

### Creating and Using EchoSkill

```typescript
import { EchoSkill } from '@juliaos/core/skills';

// Create the skill
const echoSkill = new EchoSkill({
  name: 'echo-skill',
  type: 'utility',
  prefix: 'Echo: ',
  parameters: {}
});

// Initialize the skill
await echoSkill.initialize();

// Listen for events
echoSkill.on('executionComplete', (data) => {
  console.log(`Result: ${data.result}`);
});

// Use the skill
echoSkill.setInput('Hello, world!');
await echoSkill.execute();
// Output: Result: Echo: Hello, world!

// Stop the skill
await echoSkill.stop();
```

### Agent Using Multiple Skills

```typescript
import { BaseAgent } from '@juliaos/core/agent';
import { EchoSkill, DeFiTradingSkill } from '@juliaos/core/skills';

// Create agent with skills
const agent = new BaseAgent({
  name: 'trading-agent',
  type: 'defi',
  skills: [
    new EchoSkill({
      name: 'echo-skill',
      type: 'utility',
      prefix: 'Agent: '
    }),
    new DeFiTradingSkill({
      name: 'trading-skill',
      type: 'trading',
      parameters: {
        tradingPairs: ['ETH/USDC', 'BTC/USDC'],
        // Other trading parameters
      }
    })
  ]
});

// Initialize agent
await agent.initialize();

// Start agent (this will also start all skills)
await agent.start();

// Stop agent (this will also stop all skills)
await agent.stop();
```

## Contributing New Skills

When contributing new skills to the JuliaOS Framework, please follow these guidelines:

1. Follow the skill template above.
2. Provide comprehensive documentation.
3. Include unit tests for your skill.
4. Keep dependencies minimal and well-justified.
5. Handle errors properly and clean up resources.
6. Make the skill configurable and event-driven.
7. Ensure the skill follows the lifecycle methods correctly.

## Future Development

The Skills module is under active development. Planned improvements include:

- More built-in skills for common tasks
- Better integration with external services
- Skill composition for creating complex skills from simpler ones
- Skill marketplace for sharing and discovering skills
- Enhanced testing utilities for skills 