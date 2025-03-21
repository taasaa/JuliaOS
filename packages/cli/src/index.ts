#!/usr/bin/env node

import { Command } from 'commander';
import { createAgent } from './commands/agent';
import { createSwarm } from './commands/swarm';
import { listAgents, listSwarms } from './commands/list';
import { startAgent, startSwarm } from './commands/start';
import { stopAgent, stopSwarm } from './commands/stop';
import { deleteAgent, deleteSwarm } from './commands/delete';
import { config } from 'dotenv';

// Load environment variables
config();

const program = new Command();

program
  .name('juliaos')
  .description('JuliaOS Framework CLI - Create and manage AI-powered trading agents and swarms')
  .version('1.0.0');

// Agent commands
program
  .command('agent')
  .description('Create a new trading agent')
  .option('-n, --name <name>', 'Name of the agent')
  .option('-t, --type <type>', 'Type of agent (trading, analysis, etc.)')
  .option('-p, --platform <platform>', 'Platform to use (discord, telegram, etc.)')
  .option('-s, --skills <skills...>', 'Skills to enable (trading, analysis, etc.)')
  .action(createAgent);

program
  .command('swarm')
  .description('Create a new trading swarm')
  .option('-n, --name <name>', 'Name of the swarm')
  .option('-s, --size <size>', 'Number of particles in the swarm')
  .option('-a, --algorithm <algorithm>', 'Swarm algorithm (pso, aco, abc, firefly)')
  .option('-p, --pairs <pairs...>', 'Trading pairs to optimize')
  .action(createSwarm);

// List commands
program
  .command('list')
  .description('List all agents and swarms')
  .option('-t, --type <type>', 'Type to list (agents, swarms, or all)')
  .action(async (options) => {
    if (options.type === 'agents' || options.type === 'all') {
      await listAgents();
    }
    if (options.type === 'swarms' || options.type === 'all') {
      await listSwarms();
    }
  });

// Start commands
program
  .command('start')
  .description('Start an agent or swarm')
  .option('-t, --type <type>', 'Type to start (agent or swarm)')
  .option('-n, --name <name>', 'Name of the agent or swarm')
  .action(async (options) => {
    if (options.type === 'agent') {
      await startAgent(options.name);
    } else if (options.type === 'swarm') {
      await startSwarm(options.name);
    }
  });

// Stop commands
program
  .command('stop')
  .description('Stop an agent or swarm')
  .option('-t, --type <type>', 'Type to stop (agent or swarm)')
  .option('-n, --name <name>', 'Name of the agent or swarm')
  .action(async (options) => {
    if (options.type === 'agent') {
      await stopAgent(options.name);
    } else if (options.type === 'swarm') {
      await stopSwarm(options.name);
    }
  });

// Delete commands
program
  .command('delete')
  .description('Delete an agent or swarm')
  .option('-t, --type <type>', 'Type to delete (agent or swarm)')
  .option('-n, --name <name>', 'Name of the agent or swarm')
  .action(async (options) => {
    if (options.type === 'agent') {
      await deleteAgent(options.name);
    } else if (options.type === 'swarm') {
      await deleteSwarm(options.name);
    }
  });

program.parse(); 