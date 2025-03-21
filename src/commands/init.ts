import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface InitOptions {
  projectName: string;
  template: 'basic' | 'trading' | 'advanced';
  noInstall?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const { projectName, template, noInstall } = options;
  
  // Create project directory
  const projectDir = path.resolve(process.cwd(), projectName);
  
  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory ${projectName} already exists.`);
    process.exit(1);
  }
  
  fs.mkdirSync(projectDir, { recursive: true });
  
  // Create directory structure
  const directories = [
    'src/agents',
    'src/swarms',
    'src/strategies',
    'config',
    'tests',
  ];
  
  directories.forEach(dir => {
    fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
  });
  
  // Create package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    description: 'JuliaOS framework project',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'ts-node src/index.ts',
      test: 'jest',
    },
    dependencies: {
      '@juliaos/core': '^0.1.0',
      '@juliaos/protocols': '^0.1.0',
      'ethers': '^6.0.0',
      'dotenv': '^16.0.0',
    },
    devDependencies: {
      '@types/jest': '^29.0.0',
      '@types/node': '^18.0.0',
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      'ts-node': '^10.0.0',
      'typescript': '^5.0.0',
    },
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'es2020',
      module: 'commonjs',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src'],
    exclude: ['node_modules', 'dist', 'tests'],
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
  
  // Create .env file
  const envContent = `# Network RPC URLs
ETHEREUM_RPC_URL=your_ethereum_rpc_url
BASE_RPC_URL=your_base_rpc_url
SOLANA_RPC_URL=your_solana_rpc_url

# API Keys
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key

# Trading Parameters
MAX_POSITION_SIZE=1.0
STOP_LOSS_PERCENTAGE=5
TAKE_PROFIT_PERCENTAGE=10
`;
  
  fs.writeFileSync(path.join(projectDir, '.env'), envContent);
  
  // Create template files based on selected template
  createTemplateFiles(projectDir, template);
  
  // Install dependencies
  if (!noInstall) {
    console.log('Installing dependencies...');
    process.chdir(projectDir);
    execSync('npm install', { stdio: 'inherit' });
  }
  
  console.log(`
Project ${projectName} created successfully!

To get started:
  cd ${projectName}
  ${noInstall ? 'npm install' : ''}
  npm run dev
`);
}

function createTemplateFiles(projectDir: string, template: string): void {
  // Create index.ts
  const indexContent = `import dotenv from 'dotenv';
import { startAgent } from './agents';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting JuliaOS project...');
  await startAgent();
}

main().catch(console.error);
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/index.ts'), indexContent);
  
  // Create template-specific files
  switch (template) {
    case 'basic':
      createBasicTemplate(projectDir);
      break;
    case 'trading':
      createTradingTemplate(projectDir);
      break;
    case 'advanced':
      createAdvancedTemplate(projectDir);
      break;
    default:
      createBasicTemplate(projectDir);
  }
  
  // Create a README
  const readmeContent = `# ${path.basename(projectDir)}

A JuliaOS framework project.

## Getting Started

1. Configure environment variables in \`.env\`
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start development:
   \`\`\`
   npm run dev
   \`\`\`

## Project Structure

- \`src/agents\`: Trading agents
- \`src/swarms\`: Agent coordination
- \`src/strategies\`: Trading strategies
- \`config\`: Configuration files
- \`tests\`: Test files
`;
  
  fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);
}

function createBasicTemplate(projectDir: string): void {
  // Create a basic agent
  const agentContent = `import { Agent } from '@juliaos/core';

export class SimpleAgent extends Agent {
  async initialize() {
    console.log('SimpleAgent initialized');
  }

  async onUpdate() {
    console.log('SimpleAgent updated');
  }
}

export async function startAgent() {
  const agent = new SimpleAgent();
  await agent.initialize();
  
  // Simulate updates
  setInterval(() => agent.onUpdate(), 5000);
}
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/agents/index.ts'), agentContent);
}

function createTradingTemplate(projectDir: string): void {
  // Create a trading agent
  const agentContent = `import { CrossChainAgent } from '@juliaos/protocols';
import { createCrossChainService, createMarketDataService } from '../services';

export async function startAgent() {
  // Initialize services
  const crossChainService = await createCrossChainService();
  const marketDataService = await createMarketDataService();

  // Create the agent
  const agent = new CrossChainAgent(
    {
      name: 'momentum-agent',
      strategy: 'momentum',
      chains: ['solana', 'ethereum'],
      maxPositionSize: process.env.MAX_POSITION_SIZE || '1.0',
      maxTotalExposure: '10.0',
      stopLoss: Number(process.env.STOP_LOSS_PERCENTAGE || '5'),
      takeProfit: Number(process.env.TAKE_PROFIT_PERCENTAGE || '10'),
      leverage: 1,
    },
    crossChainService,
    marketDataService
  );

  // Start executing trades
  setInterval(() => agent.executeTrades(), 60000);
  
  console.log('Trading agent started');
  return agent;
}
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/agents/index.ts'), agentContent);
  
  // Create services file
  const servicesContent = `import { CrossChainService, MarketDataService } from '@juliaos/protocols';

export async function createCrossChainService() {
  const service = new CrossChainService();
  
  // Initialize chains
  await service.initializeChain('solana');
  await service.initializeChain('ethereum');
  
  return service;
}

export async function createMarketDataService() {
  const service = new MarketDataService();
  
  // Initialize market data providers
  await service.initialize();
  
  return service;
}
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/services.ts'), servicesContent);
}

function createAdvancedTemplate(projectDir: string): void {
  // Create advanced setup with swarm
  const swarmContent = `import { CrossChainSwarm } from '@juliaos/protocols';
import { createCrossChainService, createMarketDataService } from '../services';

export async function startSwarm() {
  // Initialize services
  const crossChainService = await createCrossChainService();
  const marketDataService = await createMarketDataService();

  // Create the swarm
  const swarm = new CrossChainSwarm(
    {
      name: 'trading-swarm',
      coordinationStrategy: 'hierarchical',
      chains: ['solana', 'ethereum', 'base'],
      maxTotalExposure: '20.0',
      maxDrawdown: 10,
      maxDailyLoss: '5.0',
      agents: [
        {
          name: 'momentum-agent',
          strategy: 'momentum',
          chains: ['solana', 'ethereum'],
          maxPositionSize: '1.0',
          maxTotalExposure: '5.0',
          stopLoss: 5,
          takeProfit: 10,
          leverage: 1,
        },
        {
          name: 'trend-agent',
          strategy: 'trend-following',
          chains: ['solana', 'ethereum'],
          maxPositionSize: '2.0',
          maxTotalExposure: '10.0',
          stopLoss: 7,
          takeProfit: 15,
          leverage: 1,
        },
      ],
    },
    crossChainService,
    marketDataService
  );

  // Initialize and start the swarm
  await swarm.initialize();
  await swarm.start();
  
  console.log('Trading swarm started');
  return swarm;
}
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/swarms/index.ts'), swarmContent);
  
  // Update index.ts to use swarm
  const indexContent = `import dotenv from 'dotenv';
import { startSwarm } from './swarms';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting JuliaOS advanced project...');
  await startSwarm();
}

main().catch(console.error);
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/index.ts'), indexContent);
  
  // Create services file (same as trading template)
  const servicesContent = `import { CrossChainService, MarketDataService } from '@juliaos/protocols';

export async function createCrossChainService() {
  const service = new CrossChainService();
  
  // Initialize chains
  await service.initializeChain('solana');
  await service.initializeChain('ethereum');
  await service.initializeChain('base');
  
  return service;
}

export async function createMarketDataService() {
  const service = new MarketDataService();
  
  // Initialize market data providers
  await service.initialize();
  
  return service;
}
`;
  
  fs.writeFileSync(path.join(projectDir, 'src/services.ts'), servicesContent);
} 