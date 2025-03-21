# Simple Agent Example

This example demonstrates how to create a simple trading agent using the JuliaOS Framework.

## Overview

In this example, we will create a basic trading agent that uses a momentum trading strategy. The agent will monitor the market for price changes and execute trades based on predefined thresholds.

## Prerequisites

- JuliaOS Framework installed
- Basic understanding of TypeScript

## Step-by-Step Guide

### Step 1: Create the Agent

Create a new file `src/agents/MomentumAgent.ts`:

```typescript
import { Agent } from '@juliaos/core';

class MomentumAgent extends Agent {
  async initialize() {
    console.log('MomentumAgent initialized');
  }

  async onUpdate() {
    const marketData = await this.marketDataService.getMarketData(this.token);
    const priceChange = marketData.priceChange24h || 0;

    if (priceChange > this.strategy.parameters.momentumThreshold) {
      console.log('Executing trade based on momentum');
      // Execute trade logic here
    }
  }
}
```

### Step 2: Configure the Agent

Create a configuration file `config/agent.config.json`:

```json
{
  "id": "momentum-agent-1",
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
    "type": "momentum",
    "parameters": {
      "momentumThreshold": 0.05
    }
  }
}
```

### Step 3: Run the Agent

Create a script `src/scripts/runAgent.ts` to run the agent:

```typescript
import { MomentumAgent } from '../agents/MomentumAgent';
import { loadConfig } from '@juliaos/utils';

async function main() {
  const config = loadConfig('config/agent.config.json');
  const agent = new MomentumAgent(config);
  await agent.initialize();
  setInterval(() => agent.onUpdate(), 60000); // Update every minute
}

main().catch(console.error);
```

### Step 4: Execute the Script

Run the script using Node.js:

```bash
node src/scripts/runAgent.ts
```

## Conclusion

This example demonstrates how to create a simple trading agent using the JuliaOS Framework. The agent uses a momentum trading strategy to make trading decisions based on market data.

## Next Steps

1. Explore more complex strategies in the [Framework Guide](../framework/guide.md).
2. Check out the [Trading Swarm Example](trading-swarm.md) for multi-agent coordination.
3. Review [Security Best Practices](../advanced/security.md) for production deployment. 