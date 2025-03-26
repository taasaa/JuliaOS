import { Command } from 'commander';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { checkProjectInitialized } from '../utils/project';
import { installDependencies } from '../utils/dependencies';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { SwarmConfig } from '@j3os/core';
import { WalletManager } from '@j3os/wallets';
import { RateLimiter } from '@j3os/utils';
import { SecurityManager } from '@j3os/security';

// Define available swarm algorithms
const AVAILABLE_ALGORITHMS = [
  {
    name: 'Particle Swarm Optimization (PSO) - Good general-purpose algorithm', 
    value: 'pso',
    params: {
      inertia_weight: 0.7,
      cognitive_coef: 1.5,
      social_coef: 1.5,
      max_velocity: 1.0
    }
  },
  {
    name: 'Grey Wolf Optimizer (GWO) - Excels in changing market conditions', 
    value: 'gwo',
    params: {
      alpha_param: 2.0,
      decay_rate: 0.01
    }
  },
  {
    name: 'Whale Optimization Algorithm (WOA) - Great for volatile markets', 
    value: 'woa',
    params: {
      a_decrease_factor: 2.0,
      spiral_constant: 1.0
    }
  },
  {
    name: 'Genetic Algorithm (GA) - Best for complex trading strategies', 
    value: 'genetic',
    params: {
      crossover_rate: 0.8,
      mutation_rate: 0.1,
      elitism_count: 2,
      tournament_size: 3
    }
  },
  {
    name: 'Ant Colony Optimization (ACO) - Optimal for path-dependent trading', 
    value: 'aco',
    params: {
      evaporation_rate: 0.1,
      alpha: 1.0,
      beta: 2.0
    }
  }
];

// Define available trading pairs
const TRADING_PAIRS = [
  { name: 'ETH/USDC', value: 'ETH/USDC' },
  { name: 'BTC/USDC', value: 'BTC/USDC' },
  { name: 'SOL/USDC', value: 'SOL/USDC' },
  { name: 'AVAX/USDC', value: 'AVAX/USDC' },
  { name: 'BASE/USDC', value: 'BASE/USDC' },
  { name: 'MATIC/USDC', value: 'MATIC/USDC' },
  { name: 'AAVE/USDC', value: 'AAVE/USDC' },
  { name: 'UNI/USDC', value: 'UNI/USDC' },
  { name: 'CUSTOM', value: 'CUSTOM' }
];

// Define trading mode options
const TRADING_MODES = [
  { name: 'Backtesting - Optimize on historical data', value: 'backtest' },
  { name: 'Paper Trading - Test without real funds', value: 'paper' },
  { name: 'Live Trading - Use real funds (use with caution)', value: 'live' }
];

// Define execution type options
const EXECUTION_TYPES = [
  { name: 'Swarm - Use swarm intelligence to optimize parameters', value: 'swarm' },
  { name: 'Agent - Use a single agent with fixed parameters', value: 'agent' }
];

// Define algorithm options
const ALGORITHM_OPTIONS = [
  { name: 'Particle Swarm Optimization', value: 'pso' },
  { name: 'Ant Colony Optimization', value: 'aco' },
  { name: 'Artificial Bee Colony', value: 'abc' },
  { name: 'Firefly Algorithm', value: 'firefly' }
];

// Define available strategies
const AVAILABLE_STRATEGIES = [
  { name: 'Cross-Chain Arbitrage', value: 'arbitrage' },
  { name: 'Liquidity Provision', value: 'liquidity' },
  { name: 'Market Making', value: 'market_making' },
  { name: 'Trend Following', value: 'trend_following' },
  { name: 'Mean Reversion', value: 'mean_reversion' }
];

// Define available networks
const AVAILABLE_NETWORKS = [
  { name: 'Ethereum', value: 'ethereum' },
  { name: 'Solana', value: 'solana' },
  { name: 'Base', value: 'base' },
  { name: 'Polygon', value: 'polygon' }
];

// Define available wallet types
const AVAILABLE_WALLETS = [
  { name: 'MetaMask', value: 'metamask' },
  { name: 'Phantom', value: 'phantom' },
  { name: 'Rabby', value: 'rabby' },
  { name: 'Custom RPC', value: 'custom' }
];

// Add rate limiter for API calls
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindow: 60000 // 1 minute
});

// Add security manager
const securityManager = new SecurityManager();

// Add error handling wrapper
async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error(chalk.red('Network error:'), error.message);
      console.log(chalk.yellow('Please check your internet connection and try again.'));
    } else if (error instanceof WalletError) {
      console.error(chalk.red('Wallet error:'), error.message);
      console.log(chalk.yellow('Please check your wallet connection and permissions.'));
    } else if (error instanceof ValidationError) {
      console.error(chalk.red('Validation error:'), error.message);
      console.log(chalk.yellow('Please check your input and try again.'));
    } else {
      console.error(chalk.red('Unexpected error:'), error.message);
      console.log(chalk.yellow('Please try again or contact support if the issue persists.'));
    }
    process.exit(1);
  }
}

/**
 * Function to configure a new DeFi trading setup
 */
async function configureDeFiTrading() {
  await withErrorHandling(async () => {
    // Ensure project is initialized
    if (!checkProjectInitialized()) {
      console.log(chalk.red('Error: Project not initialized. Run "j3os init" first.'));
      return;
    }

    // Check for required environment variables
    await checkEnvironmentVariables();

    console.log(chalk.blue('\n=== Configure DeFi Trading ===\n'));

    // Add wallet configuration before strategy selection
    const { walletType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'walletType',
        message: 'Choose wallet type:',
        choices: AVAILABLE_WALLETS
      }
    ]);

    // Configure wallet based on type
    const walletConfig = await configureWallet(walletType);

    // Validate wallet configuration
    await validateWalletConfig(walletConfig);

    // First, ask for strategy type
    const { strategy } = await inquirer.prompt([
      {
        type: 'list',
        name: 'strategy',
        message: 'Choose trading strategy:',
        choices: AVAILABLE_STRATEGIES
      }
    ]);

    // Then, ask for execution type
    const { executionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'executionType',
        message: 'Choose execution type:',
        choices: EXECUTION_TYPES
      }
    ]);

    // Get network selection
    const { networks } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'networks',
        message: 'Select networks to trade on:',
        choices: AVAILABLE_NETWORKS,
        validate: input => input.length > 0
      }
    ]);

    // Validate network configuration
    await validateNetworkConfig(networks, walletConfig);

    // Configuration will depend on the execution type and strategy
    if (executionType === 'swarm') {
      await configureSwarmExecution(strategy, networks, walletConfig);
    } else {
      await configureAgentExecution(strategy, networks, walletConfig);
    }
  });
}

// Add environment variable check
async function checkEnvironmentVariables() {
  const requiredVars = [
    'WEB3_PROVIDER',
    'API_KEY',
    'WALLET_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red('Missing required environment variables:'));
    missingVars.forEach(varName => {
      console.error(chalk.yellow(`- ${varName}`));
    });
    console.log(chalk.blue('\nPlease set these variables in your .env file.'));
    process.exit(1);
  }
}

// Add wallet configuration validation
async function validateWalletConfig(walletConfig: any) {
  const walletManager = new WalletManager();
  
  try {
    // Validate wallet address
    if (!walletManager.validateAddress(walletConfig.address)) {
      throw new ValidationError('Invalid wallet address');
    }

    // Check wallet balance
    const balance = await walletManager.getBalance(walletConfig.address);
    if (balance <= 0) {
      throw new ValidationError('Insufficient wallet balance');
    }

    // Check network connectivity
    await walletManager.checkConnection(walletConfig.provider);
  } catch (error) {
    throw new WalletError(`Wallet validation failed: ${error.message}`);
  }
}

// Add network configuration validation
async function validateNetworkConfig(networks: string[], walletConfig: any) {
  const walletManager = new WalletManager();
  
  try {
    // Check network support
    const supportedNetworks = await walletManager.getSupportedNetworks(walletConfig.type);
    const unsupportedNetworks = networks.filter(network => !supportedNetworks.includes(network));
    
    if (unsupportedNetworks.length > 0) {
      throw new ValidationError(`Selected wallet does not support networks: ${unsupportedNetworks.join(', ')}`);
    }

    // Check network connectivity
    await Promise.all(networks.map(network => 
      walletManager.checkNetworkConnection(network)
    ));
  } catch (error) {
    throw new NetworkError(`Network validation failed: ${error.message}`);
  }
}

// Add custom error classes
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function configureWallet(walletType: string) {
  const walletManager = new WalletManager();
  
  // Apply rate limiting
  await rateLimiter.waitForSlot();
  
  // Validate wallet type
  if (!AVAILABLE_WALLETS.some(w => w.value === walletType)) {
    throw new ValidationError(`Unsupported wallet type: ${walletType}`);
  }
  
  // Get wallet configuration with security measures
  const config = await getWalletConfig(walletType, walletManager);
  
  // Encrypt sensitive data
  const encryptedConfig = await securityManager.encryptConfig(config);
  
  return encryptedConfig;
}

// Add secure configuration storage
async function saveConfiguration(config: any, type: 'swarm' | 'agent') {
  const configDir = join(process.cwd(), 'config');
  const configPath = join(configDir, `${type}.json`);
  
  // Encrypt sensitive data before saving
  const encryptedConfig = await securityManager.encryptConfig(config);
  
  // Save encrypted configuration
  writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2));
  
  // Set proper file permissions
  await securityManager.setSecureFilePermissions(configPath);
}

async function configureMetaMask(walletManager: WalletManager) {
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: 'Enter MetaMask wallet address:',
      validate: input => walletManager.validateAddress(input)
    }
  ]);

  return {
    type: 'metamask',
    address,
    provider: 'ethereum'
  };
}

async function configurePhantom(walletManager: WalletManager) {
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: 'Enter Phantom wallet address:',
      validate: input => walletManager.validateAddress(input)
    }
  ]);

  return {
    type: 'phantom',
    address,
    provider: 'solana'
  };
}

async function configureRabby(walletManager: WalletManager) {
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: 'Enter Rabby wallet address:',
      validate: input => walletManager.validateAddress(input)
    }
  ]);

  return {
    type: 'rabby',
    address,
    provider: 'ethereum'
  };
}

async function configureCustomRPC() {
  const { rpcUrl, chainId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'rpcUrl',
      message: 'Enter custom RPC URL:',
      validate: input => walletManager.validateRPCUrl(input)
    },
    {
      type: 'number',
      name: 'chainId',
      message: 'Enter chain ID:',
      validate: input => walletManager.validateChainId(input)
    }
  ]);

  return {
    type: 'custom',
    rpcUrl,
    chainId
  };
}

/**
 * Configure swarm-based DeFi trading
 */
async function configureSwarmExecution(strategy: string, networks: string[], walletConfig: any) {
  console.log(chalk.blue(`\n=== ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Swarm Configuration ===\n`));

  // Get swarm configuration from user
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter swarm name:',
      validate: input => input.length > 0
    },
    {
      type: 'number',
      name: 'size',
      message: 'Enter swarm size:',
      default: 100,
      validate: input => input > 0
    },
    {
      type: 'list',
      name: 'algorithm',
      message: 'Choose optimization algorithm:',
      choices: AVAILABLE_ALGORITHMS
    },
    {
      type: 'checkbox',
      name: 'tradingPairs',
      message: 'Select trading pairs:',
      choices: TRADING_PAIRS,
      validate: input => input.length > 0
    },
    {
      type: 'number',
      name: 'maxPositionSize',
      message: 'Enter maximum position size (0-1):',
      default: 0.1,
      validate: input => input > 0 && input <= 1
    },
    {
      type: 'number',
      name: 'stopLoss',
      message: 'Enter stop loss percentage:',
      default: 5,
      validate: input => input > 0
    },
    {
      type: 'number',
      name: 'takeProfit',
      message: 'Enter take profit percentage:',
      default: 10,
      validate: input => input > 0
    },
    {
      type: 'number',
      name: 'maxDrawdown',
      message: 'Enter maximum drawdown percentage:',
      default: 20,
      validate: input => input > 0
    }
  ]);

  // Create swarm configuration
  const swarmConfig: SwarmConfig = {
    name: config.name,
    size: config.size,
    algorithm: config.algorithm,
    trading_pairs: config.tradingPairs,
    networks: networks,
    strategy: strategy,
    parameters: {
      max_position_size: config.maxPositionSize,
      stop_loss: config.stopLoss / 100,
      take_profit: config.takeProfit / 100,
      max_drawdown: config.maxDrawdown / 100,
      learning_rate: 0.1,
      inertia: 0.7,
      cognitive_weight: 1.5,
      social_weight: 1.5
    },
    wallet: walletConfig
  };

  // Save configuration
  await saveConfiguration(swarmConfig, 'swarm');

  // Generate Julia swarm implementation based on strategy
  const juliaSwarmCode = generateJuliaSwarmCode(swarmConfig, strategy);
  const juliaDir = join(process.cwd(), 'julia', 'src', 'swarms');
  writeFileSync(join(juliaDir, `${config.name}.jl`), juliaSwarmCode);

  console.log(chalk.green('\nSwarm configuration saved successfully!'));
  console.log(chalk.yellow('\nTo start the swarm, run:'));
  console.log(`j3os start -t swarm -n ${config.name}`);
}

function generateJuliaSwarmCode(config: SwarmConfig, strategy: string): string {
  // Import appropriate modules based on strategy
  const imports = getStrategyImports(strategy);
  
  // Add wallet imports
  const walletImports = getWalletImports(config.wallet.type);
  
  return `
${imports}
${walletImports}

function initialize_${config.name.toLowerCase()}_swarm()
    swarm_config = SwarmConfig(
        "${config.name}",
        ${config.size},
        "${config.algorithm}",
        ${config.trading_pairs},
        ${config.networks},
        "${config.strategy}",
        Dict{String, Any}(
            "max_position_size" => ${config.parameters.max_position_size},
            "stop_loss" => ${config.parameters.stop_loss},
            "take_profit" => ${config.parameters.take_profit},
            "max_drawdown" => ${config.parameters.max_drawdown},
            "learning_rate" => ${config.parameters.learning_rate},
            "inertia" => ${config.parameters.inertia},
            "cognitive_weight" => ${config.parameters.cognitive_weight},
            "social_weight" => ${config.parameters.social_weight}
        )
    )
    
    # Initialize wallet connection
    wallet = initialize_wallet("${config.wallet.type}", "${config.wallet.address}")
    
    create_swarm(swarm_config)
end

function update_${config.name.toLowerCase()}_swarm!(swarm::Swarm)
    # Implement swarm update logic based on strategy
    for agent in swarm.agents
        update_agent_strategy!(agent, swarm)
        execute_trade(agent, swarm)
    end
end

function execute_trade(agent::${config.name}, market_data::Dict{String, Any})
    # ... existing trade execution ...
    
    # Add wallet transaction handling
    if trade_result["success"]
        execute_wallet_transaction(wallet, trade_result["transaction"])
    end
    
    # ... rest of execution ...
end
`;
}

function getStrategyImports(strategy: string): string {
  switch (strategy) {
    case 'arbitrage':
      return `
using ..JuliaOS
using ..SwarmManager
using ..MarketData
using ..CrossChainArbitrage
`;
    case 'liquidity':
      return `
using ..JuliaOS
using ..SwarmManager
using ..MarketData
using ..LiquidityProvider
`;
    default:
      return `
using ..JuliaOS
using ..SwarmManager
using ..MarketData
`;
  }
}

function getWalletImports(walletType: string): string {
  switch (walletType) {
    case 'metamask':
      return `
using ..Wallets.MetaMask
`;
    case 'phantom':
      return `
using ..Wallets.Phantom
`;
    case 'rabby':
      return `
using ..Wallets.Rabby
`;
    case 'custom':
      return `
using ..Wallets.CustomRPC
`;
    default:
      return '';
  }
}

/**
 * Configure agent-based DeFi trading
 */
async function configureAgentExecution(strategy: string, networks: string[], walletConfig: any) {
  console.log(chalk.blue(`\n=== ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Agent Configuration ===\n`));

  // Get agent configuration from user
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter agent name:',
      validate: input => input.length > 0
    },
    {
      type: 'checkbox',
      name: 'tradingPairs',
      message: 'Select trading pairs:',
      choices: TRADING_PAIRS,
      validate: input => input.length > 0
    },
    {
      type: 'number',
      name: 'maxPositionSize',
      message: 'Enter maximum position size (0-1):',
      default: 0.1,
      validate: input => input > 0 && input <= 1
    },
    {
      type: 'number',
      name: 'stopLoss',
      message: 'Enter stop loss percentage:',
      default: 5,
      validate: input => input > 0
    },
    {
      type: 'number',
      name: 'takeProfit',
      message: 'Enter take profit percentage:',
      default: 10,
      validate: input => input > 0
    },
    {
      type: 'number',
      name: 'maxDrawdown',
      message: 'Enter maximum drawdown percentage:',
      default: 20,
      validate: input => input > 0
    }
  ]);

  // Create agent configuration
  const agentConfig = {
    name: config.name,
    type: strategy,
    networks: networks,
    trading_pairs: config.tradingPairs,
    risk_parameters: {
      max_position_size: config.maxPositionSize,
      stop_loss: config.stopLoss / 100,
      take_profit: config.takeProfit / 100,
      max_drawdown: config.maxDrawdown / 100
    },
    wallet: walletConfig
  };

  // Save configuration
  await saveConfiguration(agentConfig, 'agent');

  // Generate Julia agent implementation based on strategy
  const juliaAgentCode = generateJuliaAgentCode(agentConfig, strategy);
  const juliaDir = join(process.cwd(), 'julia', 'src', 'agents');
  writeFileSync(join(juliaDir, `${config.name}.jl`), juliaAgentCode);

  console.log(chalk.green('\nAgent configuration saved successfully!'));
  console.log(chalk.yellow('\nTo start the agent, run:'));
  console.log(`j3os start -t agent -n ${config.name}`);
}

function generateJuliaAgentCode(config: any, strategy: string): string {
  // Import appropriate modules based on strategy
  const imports = getStrategyImports(strategy);
  
  // Get agent type based on strategy
  const agentType = getAgentType(strategy);
  
  return `
${imports}

struct ${config.name} <: ${agentType}
    position::Vector{Float64}
    velocity::Vector{Float64}
    state::Dict{String, Any}
    strategy::Function
    risk_tolerance::Float64
    portfolio::Dict{String, Float64}
    networks::Vector{String}
    trading_pairs::Vector{String}
end

function create_${config.name.toLowerCase()}(;initial_capital=10000.0, risk_tolerance=0.5)
    ${config.name}(
        zeros(2),  # Initial position
        zeros(2),  # Initial velocity
        Dict{String, Any}(
            "last_update" => now(),
            "performance_metrics" => Dict(
                "total_profit" => 0.0,
                "successful_trades" => 0,
                "failed_trades" => 0
            )
        ),
        ${strategy}_strategy,
        risk_tolerance,
        Dict{String, Float64}(
            "cash" => initial_capital,
            "holdings" => Dict()
        ),
        ${config.networks},
        ${config.trading_pairs}
    )
end

function ${strategy}_strategy(agent::${config.name}, market_data::Dict{String, Any})
    # Implement ${strategy} strategy
    return Dict{String, Any}(
        "action" => "hold",
        "confidence" => 0.5,
        "parameters" => Dict()
    )
end
`;
}

function getAgentType(strategy: string): string {
  switch (strategy) {
    case 'arbitrage':
      return 'CrossChainArbitrage.ArbitrageAgent';
    case 'liquidity':
      return 'LiquidityProvider.LPAgent';
    default:
      return 'JuliaOS.AbstractAgent';
  }
}

/**
 * Register the DeFi command
 */
export function registerDefiCommand(program: Command): void {
  program
    .command('defi')
    .description('Configure DeFi trading with swarm intelligence algorithms')
    .action(configureDeFiTrading);
} 