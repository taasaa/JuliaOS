import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

interface CreateOptions {
  name: string;
  description: string;
  type: 'agent' | 'skill' | 'connector' | 'swarm';
  swarmConfig?: {
    algorithm: 'particle' | 'ant' | 'bee' | 'firefly';
    size: number;
    network: 'ethereum' | 'solana' | 'base';
    tradingPairs: string[];
    riskParameters: {
      maxPositionSize: number;
      stopLoss: number;
      takeProfit: number;
      maxDrawdown: number;
    };
    walletAddresses: string[];
  };
}

const templates = {
  agent: `import { SwarmAgent } from '@juliaos/core';

export class {{name}}Agent extends SwarmAgent {
  constructor() {
    super({
      id: '{{id}}',
      name: '{{name}}',
      description: '{{description}}',
      model: 'gpt-4',
      platforms: ['discord'],
      actions: ['respond']
    });

    this.registerAction('respond', async (context) => {
      return \`Processed: \${context.parameters.message}\`;
    });
  }
}

export default {{name}}Agent;
`,

  swarm: `import { JuliaSwarm } from '@juliaos/julia-swarm';
import { SwarmConfig } from '@juliaos/core';

export class {{name}}Swarm extends JuliaSwarm {
  constructor() {
    const config: SwarmConfig = {
      type: 'particle',
      size: 100,
      parameters: {
        learningRate: 0.1,
        inertia: 0.8,
        cognitiveWeight: 1.5,
        socialWeight: 1.5
      }
    };

    super({
      id: '{{id}}',
      name: '{{name}}',
      description: '{{description}}',
      config
    });
  }

  async initialize(): Promise<void> {
    await this.setupSwarm();
  }

  async optimize(): Promise<void> {
    await this.runOptimization();
  }
}

export default {{name}}Swarm;
`,

  skill: `import { AgentSkill } from '@juliaos/core';

export class {{name}}Skill extends AgentSkill {
  constructor() {
    super({
      id: '{{id}}',
      name: '{{name}}',
      description: '{{description}}',
      version: '0.1.0'
    });
  }

  async execute(context: any): Promise<any> {
    // Implement skill logic here
    return {
      success: true,
      result: 'Skill executed successfully'
    };
  }
}

export default {{name}}Skill;
`,

  connector: `import { PlatformConnector } from '@juliaos/core';

export class {{name}}Connector extends PlatformConnector {
  constructor(config: any) {
    super({
      id: '{{id}}',
      name: '{{name}}',
      description: '{{description}}',
      version: '0.1.0',
      config
    });
  }

  async connect(): Promise<void> {
    // Implement connection logic here
  }

  async disconnect(): Promise<void> {
    // Implement disconnection logic here
  }

  async send(message: any): Promise<void> {
    // Implement message sending logic here
  }
}

export default {{name}}Connector;
`
};

export async function create(type: string): Promise<void> {
  try {
    const answers = await inquirer.prompt<CreateOptions>([
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
        validate: (input) => {
          if (!input) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return 'Component name must start with a capital letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Component description:',
        default: 'A JuliaOS component'
      },
      ...(type === 'swarm' ? [
        {
          type: 'list',
          name: 'swarmConfig.algorithm',
          message: 'Select swarm algorithm:',
          choices: [
            { name: 'Particle Swarm Optimization', value: 'particle' },
            { name: 'Ant Colony Optimization', value: 'ant' },
            { name: 'Artificial Bee Colony', value: 'bee' },
            { name: 'Firefly Algorithm', value: 'firefly' }
          ]
        },
        {
          type: 'number',
          name: 'swarmConfig.size',
          message: 'Swarm size:',
          default: 100
        },
        {
          type: 'list',
          name: 'swarmConfig.network',
          message: 'Select blockchain network:',
          choices: ['ethereum', 'solana', 'base']
        },
        {
          type: 'input',
          name: 'swarmConfig.tradingPairs',
          message: 'Trading pairs (comma-separated):',
          filter: (input: string) => input.split(',').map((pair: string) => pair.trim())
        },
        {
          type: 'number',
          name: 'swarmConfig.riskParameters.maxPositionSize',
          message: 'Maximum position size:',
          default: 1.0
        },
        {
          type: 'number',
          name: 'swarmConfig.riskParameters.stopLoss',
          message: 'Stop loss percentage:',
          default: 5.0
        },
        {
          type: 'number',
          name: 'swarmConfig.riskParameters.takeProfit',
          message: 'Take profit percentage:',
          default: 10.0
        },
        {
          type: 'number',
          name: 'swarmConfig.riskParameters.maxDrawdown',
          message: 'Maximum drawdown percentage:',
          default: 20.0
        },
        {
          type: 'input',
          name: 'swarmConfig.walletAddresses',
          message: 'Wallet addresses (comma-separated):',
          filter: (input: string) => input.split(',').map((addr: string) => addr.trim())
        }
      ] : [])
    ]);

    const spinner = ora('Creating component...').start();
    const componentType = type.toLowerCase() as keyof typeof templates;
    const componentName = answers.name;
    const componentId = componentName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    const componentDir = path.join(process.cwd(), 'src', componentType + 's', componentId);

    // Create component directory
    fs.mkdirSync(componentDir, { recursive: true });

    // Create component file
    let template = templates[componentType]
      .replace(/{{name}}/g, componentName)
      .replace(/{{id}}/g, componentId)
      .replace(/{{description}}/g, answers.description);

    if (type === 'swarm' && answers.swarmConfig) {
      template = template
        .replace(/{{algorithm}}/g, answers.swarmConfig.algorithm)
        .replace(/{{size}}/g, answers.swarmConfig.size.toString())
        .replace(/{{network}}/g, answers.swarmConfig.network)
        .replace(/{{tradingPairs}}/g, JSON.stringify(answers.swarmConfig.tradingPairs))
        .replace(/{{maxPositionSize}}/g, answers.swarmConfig.riskParameters.maxPositionSize.toString())
        .replace(/{{stopLoss}}/g, answers.swarmConfig.riskParameters.stopLoss.toString())
        .replace(/{{takeProfit}}/g, answers.swarmConfig.riskParameters.takeProfit.toString())
        .replace(/{{maxDrawdown}}/g, answers.swarmConfig.riskParameters.maxDrawdown.toString())
        .replace(/{{walletAddresses}}/g, JSON.stringify(answers.swarmConfig.walletAddresses));
    }

    fs.writeFileSync(path.join(componentDir, 'index.ts'), template);

    // Create test file
    const testTemplate = `import { {{name}}${componentType.charAt(0).toUpperCase() + componentType.slice(1)} } from './index';

describe('{{name}}${componentType.charAt(0).toUpperCase() + componentType.slice(1)}', () => {
  let component: {{name}}${componentType.charAt(0).toUpperCase() + componentType.slice(1)};

  beforeEach(() => {
    component = new {{name}}${componentType.charAt(0).toUpperCase() + componentType.slice(1)}();
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });
});
`;

    fs.writeFileSync(
      path.join(componentDir, '__tests__', 'index.test.ts'),
      testTemplate
        .replace(/{{name}}/g, componentName)
        .replace(/{{type}}/g, componentType)
    );

    spinner.succeed(chalk.green('Component created successfully!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.white(`1. Implement the component logic in src/${componentType}s/${componentId}/index.ts`));
    console.log(chalk.white(`2. Add tests in src/${componentType}s/${componentId}/__tests__/index.test.ts`));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Failed to create component');
    process.exit(1);
  }
} 