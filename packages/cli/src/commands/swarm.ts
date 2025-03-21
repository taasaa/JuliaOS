import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';

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

export async function createSwarm(options: any) {
  try {
    // Validate required options
    if (!options.name || !options.size || !options.algorithm || !options.pairs) {
      console.error(chalk.red('Error: Name, size, algorithm, and trading pairs are required'));
      process.exit(1);
    }

    // Create swarm configuration
    const config: SwarmConfig = {
      name: options.name,
      size: parseInt(options.size),
      algorithm: options.algorithm as SwarmConfig['algorithm'],
      tradingPairs: options.pairs,
      parameters: {
        maxIterations: 1000,
        learningRate: 0.1,
        inertia: 0.7,
        cognitiveWeight: 1.5,
        socialWeight: 1.5,
        riskParameters: {
          maxPositionSize: 1.0,
          stopLoss: 5.0,
          takeProfit: 10.0,
          maxDrawdown: 20.0
        }
      }
    };

    // Create swarms directory if it doesn't exist
    const swarmsDir = join(process.cwd(), 'swarms');
    try {
      readFileSync(swarmsDir);
    } catch {
      writeFileSync(swarmsDir, '{}');
    }

    // Save swarm configuration
    const swarms = JSON.parse(readFileSync(swarmsDir, 'utf-8'));
    swarms[options.name] = config;
    writeFileSync(swarmsDir, JSON.stringify(swarms, null, 2));

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
      using JuliaOS.SwarmManager
      
      # Create swarm configuration
      config = SwarmManager.SwarmConfig(
        "${config.name}",
        ${config.size},
        "${config.algorithm}",
        $(JSON.stringify(config.tradingPairs)),
        $(JSON.stringify(config.parameters))
      )
      
      # Initialize swarm
      swarm = SwarmManager.create_swarm(config)
      
      # Save initial swarm state
      SwarmManager.save_swarm(swarm, "swarms/${config.name}.json")
    `);

    julia.stdin.end();

    julia.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`Successfully created swarm: ${options.name}`));
        console.log(chalk.blue('Configuration saved to swarms.json'));
        console.log(chalk.blue('\nTo start the swarm, run:'));
        console.log(chalk.cyan(`juliaos start -t swarm -n ${options.name}`));
      } else {
        console.error(chalk.red(`Failed to create swarm. Julia process exited with code ${code}`));
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(chalk.red('Failed to create swarm:'), error);
    process.exit(1);
  }
} 