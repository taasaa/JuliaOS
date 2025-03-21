# Quick Start Guide

This guide will help you get started with JuliaOS Framework quickly.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

## Installation

1. Install the JuliaOS CLI globally:
```bash
npm install -g @juliaos/cli
```

2. Create a new project:
```bash
juliaos init my-project
cd my-project
```

3. Install dependencies:
```bash
npm install
```

4. Configure your environment:
```bash
juliaos config env
```

This will create a `.env` file with the following variables:
```env
ETHEREUM_RPC_URL=your_alchemy_url
BASE_RPC_URL=your_base_url
SOLANA_RPC_URL=your_solana_url
```

## Basic Usage

### Starting Development

```bash
juliaos dev
```

This will start the development server and enable hot-reloading.

### Creating Your First Agent

Create a new file `src/agents/MyAgent.ts`:

```typescript
import { Agent } from '@juliaos/core';

export class MyAgent extends Agent {
  async initialize() {
    // Initialize your agent
    console.log('Agent initialized');
  }

  async onUpdate() {
    // Handle updates
    console.log('Agent updated');
  }
}
```

### Creating a Swarm

Create a new file `src/swarms/MySwarm.ts`:

```typescript
import { Swarm } from '@juliaos/core';
import { MyAgent } from '../agents/MyAgent';

const swarm = new Swarm({
  agents: [new MyAgent()],
  coordinationStrategy: 'hierarchical',
  coordinationParameters: {
    leaderWeight: 0.6,
    followerWeight: 0.4
  }
});

await swarm.start();
```

### Running Your Application

```bash
juliaos start
```

## Next Steps

1. Read the [Basic Concepts](basic-concepts.md) guide to understand the framework's core concepts
2. Explore the [Framework Guide](../framework/guide.md) for detailed implementation examples
3. Check out the [Examples](../examples/) section for more use cases
4. Review [Security Best Practices](../advanced/security.md) before deploying to production

## Troubleshooting

If you encounter any issues:

1. Check the [Troubleshooting Guide](../advanced/troubleshooting.md)
2. Ensure all environment variables are properly set
3. Verify your network connections
4. Check the logs using `juliaos logs`

## Getting Help

- Join our [Discord Server](https://discord.gg/juliaos)
- Check [GitHub Issues](https://github.com/juliaos/framework/issues)
- Contact support at support@juliaos.dev 