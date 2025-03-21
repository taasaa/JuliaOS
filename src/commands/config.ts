import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';

interface ConfigOptions {
  type: 'env' | 'network' | 'trading' | 'risk' | 'api-key' | 'wallet';
  action?: 'add' | 'remove' | 'list';
  service?: string;
  key?: string;
  address?: string;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  const { type, action, service, key, address } = options;
  
  switch (type) {
    case 'env':
      await configEnv();
      break;
    case 'network':
      await configNetwork();
      break;
    case 'trading':
      await configTrading();
      break;
    case 'risk':
      await configRisk();
      break;
    case 'api-key':
      await configApiKey(action, service, key);
      break;
    case 'wallet':
      await configWallet(action, address);
      break;
    default:
      console.error(`Unknown configuration type: ${type}`);
      process.exit(1);
  }
}

async function configEnv(): Promise<void> {
  console.log('Configuring environment variables...');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file...');
    const template = `# Network RPC URLs
ETHEREUM_RPC_URL=
BASE_RPC_URL=
SOLANA_RPC_URL=

# API Keys
ALCHEMY_API_KEY=
INFURA_API_KEY=

# Trading Parameters
MAX_POSITION_SIZE=1.0
STOP_LOSS_PERCENTAGE=5
TAKE_PROFIT_PERCENTAGE=10
`;

    fs.writeFileSync(envPath, template);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = promisify(rl.question).bind(rl);
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Function to update a value in the .env file
    const updateEnvValue = (key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };
    
    // Network RPCs
    console.log('\nNetwork Configuration:');
    const ethereumRPC = await question('Ethereum RPC URL: ') as string;
    if (ethereumRPC) updateEnvValue('ETHEREUM_RPC_URL', ethereumRPC);
    
    const baseRPC = await question('Base RPC URL: ') as string;
    if (baseRPC) updateEnvValue('BASE_RPC_URL', baseRPC);
    
    const solanaRPC = await question('Solana RPC URL: ') as string;
    if (solanaRPC) updateEnvValue('SOLANA_RPC_URL', solanaRPC);
    
    // API Keys
    console.log('\nAPI Keys:');
    const alchemyKey = await question('Alchemy API Key: ') as string;
    if (alchemyKey) updateEnvValue('ALCHEMY_API_KEY', alchemyKey);
    
    const infuraKey = await question('Infura API Key: ') as string;
    if (infuraKey) updateEnvValue('INFURA_API_KEY', infuraKey);
    
    // Trading Parameters
    console.log('\nTrading Parameters:');
    const maxPositionSize = await question('Max Position Size (default 1.0): ') as string;
    if (maxPositionSize) updateEnvValue('MAX_POSITION_SIZE', maxPositionSize);
    
    const stopLoss = await question('Stop Loss Percentage (default 5): ') as string;
    if (stopLoss) updateEnvValue('STOP_LOSS_PERCENTAGE', stopLoss);
    
    const takeProfit = await question('Take Profit Percentage (default 10): ') as string;
    if (takeProfit) updateEnvValue('TAKE_PROFIT_PERCENTAGE', takeProfit);
    
    // Write updated content back to file
    fs.writeFileSync(envPath, envContent);
    console.log('\nEnvironment configuration updated successfully!');
  } finally {
    rl.close();
  }
}

async function configNetwork(): Promise<void> {
  console.log('Configuring network settings...');
  
  const configDir = path.join(process.cwd(), 'config');
  const networkConfigPath = path.join(configDir, 'network.config.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Default config
  let networkConfig = {
    ethereum: {
      enabled: true,
      priority: 2,
      maxGasPrice: '50',
    },
    base: {
      enabled: true,
      priority: 1,
      maxGasPrice: '0.1',
    },
    solana: {
      enabled: true,
      priority: 3,
      maxPriorityFee: '1000',
    },
  };
  
  if (fs.existsSync(networkConfigPath)) {
    networkConfig = JSON.parse(fs.readFileSync(networkConfigPath, 'utf8'));
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = promisify(rl.question).bind(rl);
  
  try {
    console.log('\nEthereum Configuration:');
    const ethereumEnabled = await question('Enable Ethereum (y/n, default y): ') as string;
    if (ethereumEnabled === 'n' || ethereumEnabled === 'N') {
      networkConfig.ethereum.enabled = false;
    }
    
    const ethereumPriority = await question('Ethereum Priority (1-3, default 2): ') as string;
    if (ethereumPriority) {
      networkConfig.ethereum.priority = parseInt(ethereumPriority, 10);
    }
    
    const ethereumGas = await question('Ethereum Max Gas Price (default 50 gwei): ') as string;
    if (ethereumGas) {
      networkConfig.ethereum.maxGasPrice = ethereumGas;
    }
    
    console.log('\nBase Configuration:');
    const baseEnabled = await question('Enable Base (y/n, default y): ') as string;
    if (baseEnabled === 'n' || baseEnabled === 'N') {
      networkConfig.base.enabled = false;
    }
    
    const basePriority = await question('Base Priority (1-3, default 1): ') as string;
    if (basePriority) {
      networkConfig.base.priority = parseInt(basePriority, 10);
    }
    
    const baseGas = await question('Base Max Gas Price (default 0.1 gwei): ') as string;
    if (baseGas) {
      networkConfig.base.maxGasPrice = baseGas;
    }
    
    console.log('\nSolana Configuration:');
    const solanaEnabled = await question('Enable Solana (y/n, default y): ') as string;
    if (solanaEnabled === 'n' || solanaEnabled === 'N') {
      networkConfig.solana.enabled = false;
    }
    
    const solanaPriority = await question('Solana Priority (1-3, default 3): ') as string;
    if (solanaPriority) {
      networkConfig.solana.priority = parseInt(solanaPriority, 10);
    }
    
    const solanaPriorityFee = await question('Solana Max Priority Fee (default 1000): ') as string;
    if (solanaPriorityFee) {
      networkConfig.solana.maxPriorityFee = solanaPriorityFee;
    }
    
    // Write configuration to file
    fs.writeFileSync(networkConfigPath, JSON.stringify(networkConfig, null, 2));
    console.log('\nNetwork configuration updated successfully!');
  } finally {
    rl.close();
  }
}

async function configTrading(): Promise<void> {
  console.log('Configuring trading settings...');
  
  const configDir = path.join(process.cwd(), 'config');
  const tradingConfigPath = path.join(configDir, 'trading.config.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Default config
  let tradingConfig = {
    strategies: {
      momentum: {
        enabled: true,
        parameters: {
          momentumThreshold: 0.05,
          volumeThreshold: 0.1,
        },
      },
      meanReversion: {
        enabled: true,
        parameters: {
          deviationThreshold: 0.02,
        },
      },
      trendFollowing: {
        enabled: true,
        parameters: {
          shortPeriod: 20,
          longPeriod: 50,
        },
      },
    },
    riskManagement: {
      maxDrawdown: 0.1,
      dailyLossLimit: 0.05,
    },
  };
  
  if (fs.existsSync(tradingConfigPath)) {
    tradingConfig = JSON.parse(fs.readFileSync(tradingConfigPath, 'utf8'));
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = promisify(rl.question).bind(rl);
  
  try {
    console.log('\nMomentum Strategy:');
    const momentumEnabled = await question('Enable Momentum Strategy (y/n, default y): ') as string;
    if (momentumEnabled === 'n' || momentumEnabled === 'N') {
      tradingConfig.strategies.momentum.enabled = false;
    }
    
    const momentumThreshold = await question('Momentum Threshold (default 0.05): ') as string;
    if (momentumThreshold) {
      tradingConfig.strategies.momentum.parameters.momentumThreshold = parseFloat(momentumThreshold);
    }
    
    const volumeThreshold = await question('Volume Threshold (default 0.1): ') as string;
    if (volumeThreshold) {
      tradingConfig.strategies.momentum.parameters.volumeThreshold = parseFloat(volumeThreshold);
    }
    
    console.log('\nMean Reversion Strategy:');
    const meanReversionEnabled = await question('Enable Mean Reversion Strategy (y/n, default y): ') as string;
    if (meanReversionEnabled === 'n' || meanReversionEnabled === 'N') {
      tradingConfig.strategies.meanReversion.enabled = false;
    }
    
    const deviationThreshold = await question('Deviation Threshold (default 0.02): ') as string;
    if (deviationThreshold) {
      tradingConfig.strategies.meanReversion.parameters.deviationThreshold = parseFloat(deviationThreshold);
    }
    
    console.log('\nTrend Following Strategy:');
    const trendFollowingEnabled = await question('Enable Trend Following Strategy (y/n, default y): ') as string;
    if (trendFollowingEnabled === 'n' || trendFollowingEnabled === 'N') {
      tradingConfig.strategies.trendFollowing.enabled = false;
    }
    
    const shortPeriod = await question('Short MA Period (default 20): ') as string;
    if (shortPeriod) {
      tradingConfig.strategies.trendFollowing.parameters.shortPeriod = parseInt(shortPeriod, 10);
    }
    
    const longPeriod = await question('Long MA Period (default 50): ') as string;
    if (longPeriod) {
      tradingConfig.strategies.trendFollowing.parameters.longPeriod = parseInt(longPeriod, 10);
    }
    
    // Write configuration to file
    fs.writeFileSync(tradingConfigPath, JSON.stringify(tradingConfig, null, 2));
    console.log('\nTrading configuration updated successfully!');
  } finally {
    rl.close();
  }
}

async function configRisk(): Promise<void> {
  console.log('Configuring risk management settings...');
  
  const configDir = path.join(process.cwd(), 'config');
  const riskConfigPath = path.join(configDir, 'risk.config.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Default config
  let riskConfig = {
    maxDrawdown: 0.1,
    dailyLossLimit: 0.05,
    positionLimits: {
      maxPositionSize: '1.0',
      maxTotalExposure: '10.0',
      maxPositionsPerChain: 5,
      maxTotalPositions: 15,
    },
    stopLoss: {
      enabled: true,
      percentage: 5,
    },
    takeProfit: {
      enabled: true,
      percentage: 10,
    },
  };
  
  if (fs.existsSync(riskConfigPath)) {
    riskConfig = JSON.parse(fs.readFileSync(riskConfigPath, 'utf8'));
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = promisify(rl.question).bind(rl);
  
  try {
    console.log('\nGeneral Risk Parameters:');
    const maxDrawdown = await question('Max Drawdown (default 0.1): ') as string;
    if (maxDrawdown) {
      riskConfig.maxDrawdown = parseFloat(maxDrawdown);
    }
    
    const dailyLossLimit = await question('Daily Loss Limit (default 0.05): ') as string;
    if (dailyLossLimit) {
      riskConfig.dailyLossLimit = parseFloat(dailyLossLimit);
    }
    
    console.log('\nPosition Limits:');
    const maxPositionSize = await question('Max Position Size (default 1.0): ') as string;
    if (maxPositionSize) {
      riskConfig.positionLimits.maxPositionSize = maxPositionSize;
    }
    
    const maxTotalExposure = await question('Max Total Exposure (default 10.0): ') as string;
    if (maxTotalExposure) {
      riskConfig.positionLimits.maxTotalExposure = maxTotalExposure;
    }
    
    const maxPositionsPerChain = await question('Max Positions Per Chain (default 5): ') as string;
    if (maxPositionsPerChain) {
      riskConfig.positionLimits.maxPositionsPerChain = parseInt(maxPositionsPerChain, 10);
    }
    
    const maxTotalPositions = await question('Max Total Positions (default 15): ') as string;
    if (maxTotalPositions) {
      riskConfig.positionLimits.maxTotalPositions = parseInt(maxTotalPositions, 10);
    }
    
    console.log('\nStop Loss Configuration:');
    const stopLossEnabled = await question('Enable Stop Loss (y/n, default y): ') as string;
    if (stopLossEnabled === 'n' || stopLossEnabled === 'N') {
      riskConfig.stopLoss.enabled = false;
    }
    
    const stopLossPercentage = await question('Stop Loss Percentage (default 5): ') as string;
    if (stopLossPercentage) {
      riskConfig.stopLoss.percentage = parseFloat(stopLossPercentage);
    }
    
    console.log('\nTake Profit Configuration:');
    const takeProfitEnabled = await question('Enable Take Profit (y/n, default y): ') as string;
    if (takeProfitEnabled === 'n' || takeProfitEnabled === 'N') {
      riskConfig.takeProfit.enabled = false;
    }
    
    const takeProfitPercentage = await question('Take Profit Percentage (default 10): ') as string;
    if (takeProfitPercentage) {
      riskConfig.takeProfit.percentage = parseFloat(takeProfitPercentage);
    }
    
    // Write configuration to file
    fs.writeFileSync(riskConfigPath, JSON.stringify(riskConfig, null, 2));
    console.log('\nRisk configuration updated successfully!');
  } finally {
    rl.close();
  }
}

async function configApiKey(action = 'list', service?: string, key?: string): Promise<void> {
  const configDir = path.join(process.cwd(), 'config');
  const apiKeysPath = path.join(configDir, 'api-keys.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Initialize or load API keys
  let apiKeys: Record<string, string> = {};
  if (fs.existsSync(apiKeysPath)) {
    apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'));
  }
  
  switch (action) {
    case 'add':
      if (!service || !key) {
        console.error('Service and key are required for adding an API key');
        process.exit(1);
      }
      apiKeys[service] = key;
      fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
      console.log(`API key for ${service} added successfully!`);
      break;
      
    case 'remove':
      if (!service) {
        console.error('Service is required for removing an API key');
        process.exit(1);
      }
      if (apiKeys[service]) {
        delete apiKeys[service];
        fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
        console.log(`API key for ${service} removed successfully!`);
      } else {
        console.log(`No API key found for ${service}`);
      }
      break;
      
    case 'list':
      console.log('API Keys:');
      for (const [service, key] of Object.entries(apiKeys)) {
        console.log(`- ${service}: ${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
      }
      break;
      
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

async function configWallet(action = 'list', address?: string): Promise<void> {
  const configDir = path.join(process.cwd(), 'config');
  const walletsPath = path.join(configDir, 'wallets.json');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Initialize or load wallets
  let wallets: string[] = [];
  if (fs.existsSync(walletsPath)) {
    wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  }
  
  switch (action) {
    case 'add':
      if (!address) {
        console.error('Address is required for adding a wallet');
        process.exit(1);
      }
      if (!wallets.includes(address)) {
        wallets.push(address);
        fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
        console.log(`Wallet ${address} added successfully!`);
      } else {
        console.log(`Wallet ${address} already exists`);
      }
      break;
      
    case 'remove':
      if (!address) {
        console.error('Address is required for removing a wallet');
        process.exit(1);
      }
      const index = wallets.indexOf(address);
      if (index !== -1) {
        wallets.splice(index, 1);
        fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
        console.log(`Wallet ${address} removed successfully!`);
      } else {
        console.log(`Wallet ${address} not found`);
      }
      break;
      
    case 'list':
      console.log('Wallets:');
      wallets.forEach(wallet => {
        console.log(`- ${wallet}`);
      });
      break;
      
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
} 