import { Command } from 'commander';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { checkProjectInitialized } from '../utils/project';
import { installDependencies } from '../utils/dependencies';

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

/**
 * Function to configure a new DeFi trading setup
 */
async function configureDeFiTrading() {
  // Ensure project is initialized
  if (!checkProjectInitialized()) {
    console.log(chalk.red('Error: Project not initialized. Run "j3os init" first.'));
    return;
  }

  console.log(chalk.blue('\n=== Configure DeFi Trading ===\n'));

  // Ask the user for execution type
  const { executionType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'executionType',
      message: 'Choose execution type:',
      choices: EXECUTION_TYPES
    }
  ]);

  // Configuration will depend on the execution type
  if (executionType === 'swarm') {
    await configureSwarmExecution();
  } else {
    await configureAgentExecution();
  }
}

/**
 * Configure swarm-based DeFi trading
 */
async function configureSwarmExecution() {
  console.log(chalk.blue('\n=== Swarm Intelligence Configuration ===\n'));

  // Collect swarm information
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'swarmName',
      message: 'Enter a name for your trading swarm:',
      default: 'DeFiSwarm'
    },
    {
      type: 'list',
      name: 'algorithm',
      message: 'Choose swarm intelligence algorithm:',
      choices: AVAILABLE_ALGORITHMS
    },
    {
      type: 'number',
      name: 'swarmSize',
      message: 'Enter swarm size (number of particles/agents):',
      default: 50,
      validate: (value) => value >= 10 && value <= 200 ? true : 'Swarm size should be between 10 and 200'
    },
    {
      type: 'checkbox',
      name: 'tradingPairs',
      message: 'Select trading pairs:',
      choices: TRADING_PAIRS,
      validate: (value) => value.length > 0 ? true : 'Please select at least one trading pair'
    },
    {
      type: 'list',
      name: 'tradingMode',
      message: 'Select trading mode:',
      choices: TRADING_MODES
    },
    {
      type: 'number',
      name: 'backtestDays',
      message: 'Enter number of days for backtesting:',
      default: 30,
      when: (answers) => answers.tradingMode === 'backtest',
      validate: (value) => value > 0 ? true : 'Backtest days must be greater than 0'
    },
    {
      type: 'input',
      name: 'customPair',
      message: 'Enter custom trading pair (e.g., "LINK/USDC"):',
      when: (answers) => answers.tradingPairs.includes('CUSTOM'),
      validate: (value) => /^[A-Z]+\/[A-Z]+$/.test(value) ? true : 'Must be in format TOKEN/TOKEN'
    }
  ]);

  // Process custom pairs if any
  let tradingPairs = answers.tradingPairs.filter(pair => pair !== 'CUSTOM');
  if (answers.tradingPairs.includes('CUSTOM') && answers.customPair) {
    tradingPairs.push(answers.customPair);
  }

  // Get algorithm parameters
  const selectedAlgorithm = AVAILABLE_ALGORITHMS.find(algo => algo.value === answers.algorithm);
  const algorithmParams = { ...selectedAlgorithm.params };
  
  // Ask if user wants to customize algorithm parameters
  const { customizeParams } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customizeParams',
      message: 'Do you want to customize algorithm parameters?',
      default: false
    }
  ]);

  if (customizeParams) {
    // Create prompts for each parameter
    const paramPrompts = Object.entries(algorithmParams).map(([key, defaultValue]) => ({
      type: typeof defaultValue === 'number' ? 'number' : 'input',
      name: key,
      message: `Enter value for ${key}:`,
      default: defaultValue
    }));

    const customParams = await inquirer.prompt(paramPrompts);
    Object.assign(algorithmParams, customParams);
  }

  // Create the swarm configuration
  const swarmConfig = {
    name: answers.swarmName,
    size: answers.swarmSize,
    algorithm: answers.algorithm,
    trading_pairs: tradingPairs,
    parameters: algorithmParams,
    trading_mode: answers.tradingMode,
    backtest_days: answers.backtestDays || 30
  };

  // Generate configuration files
  await generateSwarmConfiguration(swarmConfig);
}

/**
 * Configure agent-based DeFi trading
 */
async function configureAgentExecution() {
  console.log(chalk.blue('\n=== Agent Configuration ===\n'));

  // Collect agent information
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'Enter a name for your trading agent:',
      default: 'DeFiAgent'
    },
    {
      type: 'checkbox',
      name: 'tradingPairs',
      message: 'Select trading pairs:',
      choices: TRADING_PAIRS,
      validate: (value) => value.length > 0 ? true : 'Please select at least one trading pair'
    },
    {
      type: 'list',
      name: 'tradingMode',
      message: 'Select trading mode:',
      choices: TRADING_MODES
    },
    {
      type: 'input',
      name: 'customPair',
      message: 'Enter custom trading pair (e.g., "LINK/USDC"):',
      when: (answers) => answers.tradingPairs.includes('CUSTOM'),
      validate: (value) => /^[A-Z]+\/[A-Z]+$/.test(value) ? true : 'Must be in format TOKEN/TOKEN'
    }
  ]);

  // Process custom pairs if any
  let tradingPairs = answers.tradingPairs.filter(pair => pair !== 'CUSTOM');
  if (answers.tradingPairs.includes('CUSTOM') && answers.customPair) {
    tradingPairs.push(answers.customPair);
  }

  // Define trading parameters
  const tradingParams = await inquirer.prompt([
    {
      type: 'number',
      name: 'rsiLowerThreshold',
      message: 'RSI lower threshold for buy signals (0-100):',
      default: 30,
      validate: (value) => value >= 0 && value <= 100 ? true : 'Value must be between 0 and 100'
    },
    {
      type: 'number',
      name: 'rsiUpperThreshold',
      message: 'RSI upper threshold for sell signals (0-100):',
      default: 70,
      validate: (value) => value >= 0 && value <= 100 ? true : 'Value must be between 0 and 100'
    },
    {
      type: 'number',
      name: 'stopLoss',
      message: 'Stop loss percentage (0-100):',
      default: 5,
      validate: (value) => value >= 0 && value <= 100 ? true : 'Value must be between 0 and 100'
    },
    {
      type: 'number',
      name: 'takeProfit',
      message: 'Take profit percentage (0-100):',
      default: 10,
      validate: (value) => value >= 0 && value <= 100 ? true : 'Value must be between 0 and 100'
    }
  ]);

  // Create the agent configuration
  const agentConfig = {
    name: answers.agentName,
    trading_pairs: tradingPairs,
    trading_mode: answers.tradingMode,
    parameters: {
      entry_threshold: tradingParams.rsiLowerThreshold / 100,
      exit_threshold: tradingParams.rsiUpperThreshold / 100,
      stop_loss: tradingParams.stopLoss / 100,
      take_profit: tradingParams.takeProfit / 100
    }
  };

  // Generate configuration files
  await generateAgentConfiguration(agentConfig);
}

/**
 * Generate swarm configuration files
 */
async function generateSwarmConfiguration(config) {
  try {
    // Create config directory if it doesn't exist
    const configDir = path.join(process.cwd(), 'config');
    await fs.ensureDir(configDir);

    // Write swarm configuration file
    const configFile = path.join(configDir, `${config.name.toLowerCase()}.json`);
    await fs.writeJson(configFile, config, { spaces: 2 });

    // Generate TypeScript file for the swarm
    const srcDir = path.join(process.cwd(), 'src');
    const swarmsDir = path.join(srcDir, 'swarms');
    await fs.ensureDir(swarmsDir);

    const swarmFile = path.join(swarmsDir, `${config.name.toLowerCase()}.ts`);
    
    // Create swarm file content
    const swarmContent = generateSwarmCode(config);
    await fs.writeFile(swarmFile, swarmContent);

    // Install required dependencies
    console.log(chalk.green('\nInstalling required dependencies...'));
    await installDependencies(['@juliaos/protocols', '@juliaos/core']);

    console.log(chalk.green('\nSwarm configuration complete! 🚀'));
    console.log(chalk.white(`\nConfiguration saved to: ${configFile}`));
    console.log(chalk.white(`Swarm implementation saved to: ${swarmFile}`));

    // Show next steps
    console.log(chalk.blue('\nNext steps:'));
    if (config.trading_mode === 'backtest') {
      console.log(chalk.white(`1. Run backtesting: npm run backtest -- --swarm ${config.name.toLowerCase()}`));
    } else if (config.trading_mode === 'paper') {
      console.log(chalk.white(`1. Start paper trading: npm run trade:paper -- --swarm ${config.name.toLowerCase()}`));
    } else {
      console.log(chalk.white(`1. Start live trading: npm run trade:live -- --swarm ${config.name.toLowerCase()}`));
      console.log(chalk.yellow('   ⚠️ CAUTION: Live trading uses real funds! Use at your own risk.'));
    }
    console.log(chalk.white(`2. Monitor performance: npm run monitor -- --swarm ${config.name.toLowerCase()}`));
    console.log(chalk.white(`3. Visualize results: npm run visualize -- --swarm ${config.name.toLowerCase()}`));

  } catch (error) {
    console.error(chalk.red('Error generating swarm configuration:'), error);
  }
}

/**
 * Generate agent configuration files
 */
async function generateAgentConfiguration(config) {
  try {
    // Create config directory if it doesn't exist
    const configDir = path.join(process.cwd(), 'config');
    await fs.ensureDir(configDir);

    // Write agent configuration file
    const configFile = path.join(configDir, `${config.name.toLowerCase()}.json`);
    await fs.writeJson(configFile, config, { spaces: 2 });

    // Generate TypeScript file for the agent
    const srcDir = path.join(process.cwd(), 'src');
    const agentsDir = path.join(srcDir, 'agents');
    await fs.ensureDir(agentsDir);

    const agentFile = path.join(agentsDir, `${config.name.toLowerCase()}.ts`);
    
    // Create agent file content
    const agentContent = generateAgentCode(config);
    await fs.writeFile(agentFile, agentContent);

    // Install required dependencies
    console.log(chalk.green('\nInstalling required dependencies...'));
    await installDependencies(['@juliaos/protocols', '@juliaos/core']);

    console.log(chalk.green('\nAgent configuration complete! 🚀'));
    console.log(chalk.white(`\nConfiguration saved to: ${configFile}`));
    console.log(chalk.white(`Agent implementation saved to: ${agentFile}`));

    // Show next steps
    console.log(chalk.blue('\nNext steps:'));
    if (config.trading_mode === 'backtest') {
      console.log(chalk.white(`1. Run backtesting: npm run backtest -- --agent ${config.name.toLowerCase()}`));
    } else if (config.trading_mode === 'paper') {
      console.log(chalk.white(`1. Start paper trading: npm run trade:paper -- --agent ${config.name.toLowerCase()}`));
    } else {
      console.log(chalk.white(`1. Start live trading: npm run trade:live -- --agent ${config.name.toLowerCase()}`));
      console.log(chalk.yellow('   ⚠️ CAUTION: Live trading uses real funds! Use at your own risk.'));
    }
    console.log(chalk.white(`2. Monitor performance: npm run monitor -- --agent ${config.name.toLowerCase()}`));
    console.log(chalk.white(`3. Visualize results: npm run visualize -- --agent ${config.name.toLowerCase()}`));

  } catch (error) {
    console.error(chalk.red('Error generating agent configuration:'), error);
  }
}

/**
 * Generate TypeScript code for the swarm
 */
function generateSwarmCode(config) {
  return `import { CrossChainSwarm } from '@juliaos/protocols';
import { SwarmConfig, MarketDataService } from '@juliaos/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ${config.name} - DeFi Trading Swarm
 * 
 * Algorithm: ${config.algorithm}
 * Trading Pairs: ${config.trading_pairs.join(', ')}
 * Trading Mode: ${config.trading_mode}
 */
export class ${config.name} extends CrossChainSwarm {
  private marketData: MarketDataService;

  constructor() {
    // Load configuration
    const configPath = path.join(process.cwd(), 'config', '${config.name.toLowerCase()}.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Initialize swarm with configuration
    super({
      name: config.name,
      size: config.size,
      algorithm: config.algorithm,
      tradingPairs: config.trading_pairs,
      parameters: config.parameters,
      chains: ['solana', 'ethereum', 'base'] // Default chains
    });

    // Initialize market data service
    this.marketData = new MarketDataService();

    console.log(\`${config.name} initialized with \${config.algorithm} algorithm\`);
    console.log(\`Trading pairs: \${config.trading_pairs.join(', ')}\`);
  }

  /**
   * Start the swarm
   */
  async start(): Promise<void> {
    console.log(\`Starting ${config.name}...\`);

    // Fetch historical market data for backtesting
    if ('${config.trading_mode}' === 'backtest') {
      for (const pair of this.config.tradingPairs) {
        const historicalData = await this.marketData.fetchHistorical('uniswap', pair, ${config.backtest_days || 30});
        this.addMarketData(historicalData);
      }
      
      console.log(\`Backtesting with \${${config.backtest_days || 30}} days of historical data\`);
      
      // Run optimization
      await this.optimize();
      
      // Generate trading signals
      const signals = this.generateTradingSignals();
      
      // Print results
      this.printResults();
    } else {
      // For paper or live trading, connect to real-time data sources
      for (const pair of this.config.tradingPairs) {
        await this.marketData.connectRealtime('uniswap', pair);
      }
      
      // Subscribe to market data updates
      this.marketData.onUpdate(data => {
        this.processMarketData(data);
      });
      
      console.log(\`${config.name} is now running in \${config.trading_mode} mode\`);
    }
  }
  
  /**
   * Process incoming market data
   */
  private processMarketData(data: any): void {
    // Add to our dataset
    this.addMarketData(data);
    
    // Generate signals based on new data
    const signals = this.generateTradingSignals();
    
    // Execute signals if in paper or live mode
    if ('${config.trading_mode}' !== 'backtest' && signals.length > 0) {
      for (const signal of signals) {
        this.executeSignal(signal);
      }
    }
  }
  
  /**
   * Execute a trading signal
   */
  private executeSignal(signal: any): void {
    console.log(\`Executing \${signal.type} signal for \${signal.pair} at \${signal.price}\`);
    
    // In live mode, execute actual trades
    if ('${config.trading_mode}' === 'live') {
      // Implementation of real trading execution
    }
  }
  
  /**
   * Print backtest results
   */
  private printResults(): void {
    const metrics = this.getPerformanceMetrics();
    
    console.log('\\n=== Backtest Results ===');
    console.log(\`Total Return: \${(metrics.total_return * 100).toFixed(2)}%\`);
    console.log(\`Sharpe Ratio: \${metrics.sharpe_ratio.toFixed(2)}\`);
    console.log(\`Max Drawdown: \${(metrics.max_drawdown * 100).toFixed(2)}%\`);
    console.log(\`Win Rate: \${(metrics.win_rate * 100).toFixed(2)}%\`);
    console.log(\`Best Parameters:\`);
    
    for (const [key, value] of Object.entries(this.getBestParameters())) {
      console.log(\`  \${key}: \${value}\`);
    }
  }
}

// Create and export an instance
export default new ${config.name}();
`;
}

/**
 * Generate TypeScript code for the agent
 */
function generateAgentCode(config) {
  return `import { CrossChainAgent } from '@juliaos/protocols';
import { AgentConfig, MarketDataService } from '@juliaos/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ${config.name} - DeFi Trading Agent
 * 
 * Trading Pairs: ${config.trading_pairs.join(', ')}
 * Trading Mode: ${config.trading_mode}
 */
export class ${config.name} extends CrossChainAgent {
  private marketData: MarketDataService;
  private parameters: any;

  constructor() {
    // Load configuration
    const configPath = path.join(process.cwd(), 'config', '${config.name.toLowerCase()}.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Initialize agent with configuration
    super({
      name: config.name,
      tradingPairs: config.trading_pairs,
      chains: ['solana', 'ethereum', 'base'] // Default chains
    });

    // Store parameters
    this.parameters = config.parameters;

    // Initialize market data service
    this.marketData = new MarketDataService();

    console.log(\`${config.name} initialized\`);
    console.log(\`Trading pairs: \${config.trading_pairs.join(', ')}\`);
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    console.log(\`Starting ${config.name}...\`);

    // Fetch historical market data for backtesting
    if ('${config.trading_mode}' === 'backtest') {
      for (const pair of this.config.tradingPairs) {
        const historicalData = await this.marketData.fetchHistorical('uniswap', pair, 30);
        this.processHistoricalData(historicalData);
      }
      
      console.log(\`Backtesting with 30 days of historical data\`);
      
      // Print results
      this.printResults();
    } else {
      // For paper or live trading, connect to real-time data sources
      for (const pair of this.config.tradingPairs) {
        await this.marketData.connectRealtime('uniswap', pair);
      }
      
      // Subscribe to market data updates
      this.marketData.onUpdate(data => {
        this.processMarketData(data);
      });
      
      console.log(\`${config.name} is now running in \${config.trading_mode} mode\`);
    }
  }
  
  /**
   * Process historical market data
   */
  private processHistoricalData(data: any[]): void {
    // Run through historical data chronologically
    let inPosition = false;
    let entryPrice = 0;
    let portfolio = 10000; // Starting with $10,000
    const trades = [];
    
    for (const point of data) {
      const signal = this.analyzeDataPoint(point);
      
      if (signal && signal.type === 'buy' && !inPosition) {
        inPosition = true;
        entryPrice = point.price;
        trades.push({ type: 'buy', price: point.price, timestamp: point.timestamp });
      } else if (signal && signal.type === 'sell' && inPosition) {
        const returnPct = (point.price - entryPrice) / entryPrice;
        portfolio *= (1 + returnPct);
        inPosition = false;
        trades.push({ type: 'sell', price: point.price, timestamp: point.timestamp, return: returnPct });
      }
    }
    
    // Store results
    this.trades = trades;
    this.finalPortfolio = portfolio;
  }
  
  /**
   * Process incoming market data
   */
  private processMarketData(data: any): void {
    // Generate signals based on new data
    const signal = this.analyzeDataPoint(data);
    
    // Execute signals if in paper or live mode
    if (signal) {
      this.executeSignal(signal);
    }
  }
  
  /**
   * Analyze a single data point
   */
  private analyzeDataPoint(data: any): any {
    // Extract indicators
    const rsi = data.indicators.rsi || 50;
    const bbUpper = data.indicators.bb_upper || data.price * 1.05;
    const bbLower = data.indicators.bb_lower || data.price * 0.95;
    const bbPosition = (data.price - bbLower) / (bbUpper - bbLower);
    
    // Buy signal: RSI below entry threshold and price near lower BB
    if (rsi < (this.parameters.entry_threshold * 100) && bbPosition < 0.2) {
      return { 
        type: 'buy', 
        price: data.price, 
        timestamp: data.timestamp,
        pair: data.pair || 'Unknown'
      };
    }
    
    // Sell signal: RSI above exit threshold or price near upper BB
    if (rsi > (this.parameters.exit_threshold * 100) || bbPosition > 0.8) {
      return { 
        type: 'sell', 
        price: data.price, 
        timestamp: data.timestamp,
        pair: data.pair || 'Unknown'
      };
    }
    
    return null;
  }
  
  /**
   * Execute a trading signal
   */
  private executeSignal(signal: any): void {
    console.log(\`Executing \${signal.type} signal for \${signal.pair} at \${signal.price}\`);
    
    // In live mode, execute actual trades
    if ('${config.trading_mode}' === 'live') {
      // Implementation of real trading execution
    }
  }
  
  /**
   * Print backtest results
   */
  private printResults(): void {
    if (!this.trades || this.trades.length === 0) {
      console.log('No trades executed during backtest.');
      return;
    }
    
    const totalTrades = this.trades.length;
    const sellTrades = this.trades.filter(t => t.type === 'sell');
    const winningTrades = sellTrades.filter(t => t.return > 0);
    const totalReturn = (this.finalPortfolio - 10000) / 10000;
    const winRate = winningTrades.length / sellTrades.length;
    
    console.log('\\n=== Backtest Results ===');
    console.log(\`Total Return: \${(totalReturn * 100).toFixed(2)}%\`);
    console.log(\`Total Trades: \${totalTrades}\`);
    console.log(\`Win Rate: \${(winRate * 100).toFixed(2)}%\`);
    console.log(\`Final Portfolio Value: $\${this.finalPortfolio.toFixed(2)}\`);
  }
}

// Create and export an instance
export default new ${config.name}();
`;
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