import { readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';

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

export async function stopAgent(name: string) {
  try {
    // Load agent configuration
    const agentsDir = join(process.cwd(), 'agents');
    const agents = JSON.parse(readFileSync(agentsDir, 'utf-8')) as Record<string, AgentConfig>;
    
    if (!agents[name]) {
      console.error(chalk.red(`Agent "${name}" not found`));
      process.exit(1);
    }

    console.log(chalk.blue(`Stopping agent: ${name}`));

    // Initialize Julia environment
    const julia = spawn('julia', ['--project=packages/julia-bridge']);
    
    julia.stdout.on('data', (data) => {
      console.log(chalk.gray(`Julia: ${data}`));
    });

    julia.stderr.on('data', (data) => {
      console.error(chalk.red(`Julia Error: ${data}`));
    });

    // Send stop command to Julia process
    julia.stdin.write(`
      using JuliaOS
      using Agents
      
      # Stop agent
      JuliaOS.stop_agent("${name}")
    `);

    julia.stdin.end();

    // Handle process termination
    julia.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Agent "${name}" stopped successfully`));
      } else {
        console.error(chalk.red(`Failed to stop agent "${name}" with error code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to stop agent:'), error);
    process.exit(1);
  }
}

export async function stopSwarm(options: any) {
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

    // Initialize Julia environment
    const julia = spawn('julia', ['--project=packages/julia-bridge']);
    
    julia.stdout.on('data', (data) => {
      console.log(chalk.gray(`Julia: ${data}`));
    });

    julia.stderr.on('data', (data) => {
      console.error(chalk.red(`Julia Error: ${data}`));
    });

    // Send stop command to Julia process
    julia.stdin.write(`
      using JuliaOS.SwarmManager
      
      # Load swarm configuration
      config = SwarmManager.SwarmConfig(
        "${config.name}",
        ${config.size},
        "${config.algorithm}",
        $(JSON.stringify(config.tradingPairs)),
        $(JSON.stringify(config.parameters))
      )
      
      # Load existing swarm state
      if isfile("swarms/${config.name}.json")
        swarm = SwarmManager.load_swarm("swarms/${config.name}.json")
        
        # Stop swarm optimization
        SwarmManager.stop_swarm!(swarm)
        
        # Save final swarm state
        SwarmManager.save_swarm(swarm, "swarms/${config.name}.json")
      else
        println("No active swarm found for ${config.name}")
        exit(1)
      end
    `);

    julia.stdin.end();

    julia.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Successfully stopped swarm: ${options.name}`));
        console.log(chalk.blue('\nTo start the swarm again, run:'));
        console.log(chalk.cyan(`juliaos start -t swarm -n ${options.name}`));
      } else {
        console.error(chalk.red(`Failed to stop swarm. Julia process exited with code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to stop swarm:'), error);
    process.exit(1);
  }
} 