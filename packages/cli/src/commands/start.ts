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

export async function startAgent(name: string) {
  try {
    // Load agent configuration
    const agentsDir = join(process.cwd(), 'agents');
    const agents = JSON.parse(readFileSync(agentsDir, 'utf-8')) as Record<string, AgentConfig>;
    
    if (!agents[name]) {
      console.error(chalk.red(`Agent "${name}" not found`));
      process.exit(1);
    }

    const config = agents[name];
    console.log(chalk.blue(`Starting agent: ${name}`));

    // Initialize Julia environment
    const julia = spawn('julia', ['--project=packages/julia-bridge']);
    
    julia.stdout.on('data', (data) => {
      console.log(chalk.gray(`Julia: ${data}`));
    });

    julia.stderr.on('data', (data) => {
      console.error(chalk.red(`Julia Error: ${data}`));
    });

    // Send configuration to Julia process
    julia.stdin.write(`
      using JuliaOS
      using Agents
      
      # Load agent configuration
      config = $(JSON.stringify(config))
      
      # Initialize agent
      agent = JuliaOS.create_agent(config)
      
      # Start agent
      JuliaOS.start_agent(agent)
      
      # Keep the process running
      while true
        sleep(1)
      end
    `);

    julia.stdin.end();

    // Handle process termination
    julia.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Agent "${name}" stopped successfully`));
      } else {
        console.error(chalk.red(`Agent "${name}" stopped with error code ${code}`));
      }
    });

    // Handle user interruption
    process.on('SIGINT', () => {
      console.log(chalk.yellow(`\nStopping agent "${name}"...`));
      julia.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('Failed to start agent:'), error);
    process.exit(1);
  }
}

export async function startSwarm(options: any) {
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

    // Send start command to Julia process
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
      
      # Load existing swarm state if available
      swarm = if isfile("swarms/${config.name}.json")
        SwarmManager.load_swarm("swarms/${config.name}.json")
      else
        SwarmManager.create_swarm(config)
      end
      
      # Start swarm optimization
      SwarmManager.start_swarm!(swarm)
    `);

    julia.stdin.end();

    julia.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Successfully started swarm: ${options.name}`));
        console.log(chalk.blue('\nTo stop the swarm, run:'));
        console.log(chalk.cyan(`juliaos stop -t swarm -n ${options.name}`));
      } else {
        console.error(chalk.red(`Failed to start swarm. Julia process exited with code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to start swarm:'), error);
    process.exit(1);
  }
} 