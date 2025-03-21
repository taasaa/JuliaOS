import { BaseAgent } from '@juliaos/core';
import { DeFiTradingSkill } from '@juliaos/core';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface AgentConfig {
  name: string;
  type: string;
  platforms: {
    name: string;
    type: string;
    parameters: any;
  }[];
  skills: {
    name: string;
    type: string;
    parameters: any;
  }[];
}

export async function createAgent(options: any) {
  try {
    // Validate required options
    if (!options.name) {
      console.error('Error: Agent name is required');
      process.exit(1);
    }

    // Create agent configuration
    const config: AgentConfig = {
      name: options.name,
      type: options.type || 'trading',
      platforms: [],
      skills: []
    };

    // Add trading skill if specified
    if (options.skills?.includes('trading')) {
      config.skills.push({
        name: 'defi-trading',
        type: 'trading',
        parameters: {
          tradingPairs: ['ETH/USDC', 'SOL/USDC'],
          swarmSize: 100,
          algorithm: 'pso',
          riskParameters: {
            maxPositionSize: 1.0,
            stopLoss: 5.0,
            takeProfit: 10.0,
            maxDrawdown: 20.0
          }
        }
      });
    }

    // Create agents directory if it doesn't exist
    const agentsDir = join(process.cwd(), 'agents');
    try {
      readFileSync(agentsDir);
    } catch {
      writeFileSync(agentsDir, '{}');
    }

    // Save agent configuration
    const agents = JSON.parse(readFileSync(agentsDir, 'utf-8'));
    agents[options.name] = config;
    writeFileSync(agentsDir, JSON.stringify(agents, null, 2));

    console.log(`Successfully created agent: ${options.name}`);
    console.log('Configuration saved to agents.json');
    console.log('\nTo start the agent, run:');
    console.log(`julia start -t agent -n ${options.name}`);

  } catch (error) {
    console.error('Failed to create agent:', error);
    process.exit(1);
  }
} 