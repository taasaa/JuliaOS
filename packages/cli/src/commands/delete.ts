import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

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

interface SwarmConfig {
  name: string;
  size: number;
  algorithm: 'pso' | 'aco' | 'abc' | 'firefly';
  tradingPairs: string[];
  parameters: {
    maxIterations: number;
    learningRate: number;
    inertia: number;
    cognitiveWeight: number;
    socialWeight: number;
    riskParameters: {
      maxPositionSize: number;
      stopLoss: number;
      takeProfit: number;
      maxDrawdown: number;
    };
  };
}

export async function deleteAgent(name: string) {
  try {
    // Load agent configuration
    const agentsDir = join(process.cwd(), 'agents');
    const agents = JSON.parse(readFileSync(agentsDir, 'utf-8')) as Record<string, AgentConfig>;
    
    if (!agents[name]) {
      console.error(chalk.red(`Agent "${name}" not found`));
      process.exit(1);
    }

    // Confirm deletion
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete agent "${name}"? This action cannot be undone.`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Deletion cancelled'));
      return;
    }

    console.log(chalk.blue(`Deleting agent: ${name}`));

    // Stop agent if running
    const julia = spawn('julia', ['--project=packages/julia-bridge']);
    
    julia.stdout.on('data', (data) => {
      console.log(chalk.gray(`Julia: ${data}`));
    });

    julia.stderr.on('data', (data) => {
      console.error(chalk.red(`Julia Error: ${data}`));
    });

    // Send delete command to Julia process
    julia.stdin.write(`
      using JuliaOS
      using Agents
      
      # Delete agent
      JuliaOS.delete_agent("${name}")
    `);

    julia.stdin.end();

    // Handle process termination
    julia.on('close', async (code) => {
      if (code === 0) {
        // Remove from configuration
        delete agents[name];
        writeFileSync(agentsDir, JSON.stringify(agents, null, 2));
        
        console.log(chalk.green(`Agent "${name}" deleted successfully`));
      } else {
        console.error(chalk.red(`Failed to delete agent "${name}" with error code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to delete agent:'), error);
    process.exit(1);
  }
}

export async function deleteSwarm(options: any) {
  try {
    // Validate required options
    if (!options.name) {
      console.error(chalk.red('Error: Swarm name is required'));
      process.exit(1);
    }

    // Load swarm configuration
    const swarmsDir = join(process.cwd(), 'swarms');
    const swarms = JSON.parse(readFileSync(swarmsDir, 'utf-8'));
    const config = swarms[options.name] as SwarmConfig;

    if (!config) {
      console.error(chalk.red(`Error: Swarm "${options.name}" not found`));
      process.exit(1);
    }

    // Confirm deletion
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete swarm "${options.name}"? This action cannot be undone.`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Deletion cancelled'));
      process.exit(0);
    }

    // Initialize Julia environment
    const julia = spawn('julia', ['--project=packages/julia-bridge']);
    
    julia.stdout.on('data', (data) => {
      console.log(chalk.gray(`Julia: ${data}`));
    });

    julia.stderr.on('data', (data) => {
      console.error(chalk.red(`Julia Error: ${data}`));
    });

    // Send delete command to Julia process
    julia.stdin.write(`
      using JuliaOS.SwarmManager
      
      # Delete swarm state file if it exists
      if isfile("swarms/${config.name}.json")
        rm("swarms/${config.name}.json")
      end
    `);

    julia.stdin.end();

    julia.on('close', (code) => {
      if (code === 0) {
        // Remove swarm from configuration
        delete swarms[options.name];
        writeFileSync(swarmsDir, JSON.stringify(swarms, null, 2));

        console.log(chalk.green(`Successfully deleted swarm: ${options.name}`));
        console.log(chalk.blue('\nTo create a new swarm, run:'));
        console.log(chalk.cyan('juliaos create -t swarm'));
      } else {
        console.error(chalk.red(`Failed to delete swarm. Julia process exited with code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to delete swarm:'), error);
    process.exit(1);
  }
} 