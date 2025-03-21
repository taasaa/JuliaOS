# Trading Swarm Example

This example demonstrates how to create and manage a trading swarm using the JuliaOS Framework.

## Overview

In this example, we will create a swarm of trading agents that work together to execute a coordinated trading strategy. The swarm will use a hierarchical coordination strategy to optimize performance.

## Prerequisites

- JuliaOS Framework installed
- Basic understanding of TypeScript

## Step-by-Step Guide

### Step 1: Create the Agents

Create a new file `src/agents/TrendFollowingAgent.ts`:

```typescript
import { Agent } from '@juliaos/core';

class TrendFollowingAgent extends Agent {
  async initialize() {
    console.log('TrendFollowingAgent initialized');
  }

  async onUpdate() {
    const marketData = await this.marketDataService.getMarketData(this.token);
    const shortMA = await this.calculateMovingAverage(this.token, 20);
    const longMA = await this.calculateMovingAverage(this.token, 50);

    if (shortMA > longMA) {
      console.log('Executing trade based on trend following');
      // Execute trade logic here
    }
  }
}
```

### Step 2: Configure the Agents

Create a configuration file `config/agents.config.json`:

```json
[
  {
    "id": "trend-agent-1",
    "tradingService": "tradingServiceInstance",
    "marketDataService": "marketDataServiceInstance",
    "riskParameters": {
      "maxPositionSize": "1.0",
      "stopLossPercentage": 5,
      "takeProfitPercentage": 10
    },
    "tradingParameters": {
      "entryThreshold": 0.02,
      "exitThreshold": 0.01
    },
    "strategy": {
      "type": "trend-following",
      "parameters": {}
    }
  },
  {
    "id": "trend-agent-2",
    "tradingService": "tradingServiceInstance",
    "marketDataService": "marketDataServiceInstance",
    "riskParameters": {
      "maxPositionSize": "2.0",
      "stopLossPercentage": 7,
      "takeProfitPercentage": 15
    },
    "tradingParameters": {
      "entryThreshold": 0.03,
      "exitThreshold": 0.015
    },
    "strategy": {
      "type": "trend-following",
      "parameters": {}
    }
  }
]
```

### Step 3: Create the Swarm

Create a new file `src/swarms/TradingSwarm.ts`:

```typescript
import { Swarm } from '@juliaos/core';
import { TrendFollowingAgent } from '../agents/TrendFollowingAgent';
import { loadConfig } from '@juliaos/utils';

async function createSwarm() {
  const agentConfigs = loadConfig('config/agents.config.json');
  const agents = agentConfigs.map(config => new TrendFollowingAgent(config));

  const swarm = new Swarm({
    agents,
    coordinationStrategy: 'hierarchical',
    coordinationParameters: {
      leaderWeight: 0.6,
      followerWeight: 0.4
    }
  });

  await swarm.start();
}

createSwarm().catch(console.error);
```

### Step 4: Run the Swarm

Execute the swarm script using Node.js:

```bash
node src/swarms/TradingSwarm.ts
```

## Conclusion

This example demonstrates how to create and manage a trading swarm using the JuliaOS Framework. The swarm uses a hierarchical coordination strategy to optimize the performance of multiple agents.

## Next Steps

1. Explore more complex coordination strategies in the [Framework Guide](../framework/guide.md).
2. Check out the [CLI Trading Swarm Guide](cli-trading.md) for command-line management.
3. Review [Security Best Practices](../advanced/security.md) for production deployment. 