#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

// Define the program
const program = new Command();

program
  .name('juliaos')
  .description('JuliaOS Framework CLI - Create and manage AI-powered trading agents and swarms')
  .version('0.1.0');

// Initialize command
program
  .command('init')
  .description('Initialize a new JuliaOS project')
  .option('-n, --name <name>', 'Name of the project')
  .action(async (options) => {
    const projectName = options.name || 'juliaos-project';
    console.log(chalk.blue(`Creating a new JuliaOS project: ${projectName}`));
    
    try {
      // Create project directory
      await fs.ensureDir(projectName);
      
      // Create basic structure
      await fs.ensureDir(path.join(projectName, 'src'));
      await fs.ensureDir(path.join(projectName, 'src', 'agents'));
      await fs.ensureDir(path.join(projectName, 'src', 'skills'));
      await fs.ensureDir(path.join(projectName, 'test'));
      
      // Create package.json
      const packageJson = {
        name: projectName,
        version: '0.1.0',
        description: 'A JuliaOS Framework project',
        main: 'dist/index.js',
        scripts: {
          build: 'tsc',
          test: 'jest',
          start: 'node dist/index.js'
        },
        dependencies: {
          '@juliaos/core': '^0.1.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          jest: '^29.0.0',
          '@types/node': '^20.0.0'
        }
      };
      
      await fs.writeJSON(path.join(projectName, 'package.json'), packageJson, { spaces: 2 });
      
      // Create tsconfig.json
      const tsconfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true
        },
        include: ['src/**/*']
      };
      
      await fs.writeJSON(path.join(projectName, 'tsconfig.json'), tsconfig, { spaces: 2 });
      
      // Create README.md
      const readme = `# ${projectName}\n\nA JuliaOS Framework project\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run build\nnpm start\n\`\`\`\n`;
      await fs.writeFile(path.join(projectName, 'README.md'), readme);
      
      // Create .gitignore
      const gitignore = `node_modules/\ndist/\n.env\n.DS_Store\n`;
      await fs.writeFile(path.join(projectName, '.gitignore'), gitignore);
      
      // Create sample agent
      const sampleAgent = `import { EventEmitter } from 'events';

export class SampleAgent extends EventEmitter {
  private name: string;
  private isRunning: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async start(): Promise<void> {
    console.log(\`Agent \${this.name} starting...\`);
    this.isRunning = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log(\`Agent \${this.name} stopping...\`);
    this.isRunning = false;
    this.emit('stopped');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getName(): string {
    return this.name;
  }
}
`;
      
      await fs.writeFile(path.join(projectName, 'src', 'agents', 'SampleAgent.ts'), sampleAgent);
      
      // Create main index.ts
      const mainIndex = `import { SampleAgent } from './agents/SampleAgent';

async function main() {
  // Create a sample agent
  const agent = new SampleAgent('MyFirstAgent');
  
  // Register event listeners
  agent.on('started', () => {
    console.log('Agent started successfully!');
  });
  
  agent.on('stopped', () => {
    console.log('Agent stopped successfully!');
  });
  
  // Start the agent
  await agent.start();
  
  // Do some work
  console.log(\`Agent \${agent.getName()} is active: \${agent.isActive()}\`);
  
  // Stop the agent
  setTimeout(async () => {
    await agent.stop();
    console.log('Process complete.');
  }, 2000);
}

main().catch(console.error);
`;
      
      await fs.writeFile(path.join(projectName, 'src', 'index.ts'), mainIndex);
      
      console.log(chalk.green('Project created successfully!'));
      console.log(chalk.white(`\nTo get started, run:\n`));
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan(`  npm install`));
      console.log(chalk.cyan(`  npm run build`));
      console.log(chalk.cyan(`  npm start`));
      
    } catch (error) {
      console.error(chalk.red('Failed to create project:'), error);
      process.exit(1);
    }
  });

// Command to create a new agent
program
  .command('create')
  .description('Create a new component (agent, skill, connector)')
  .option('-t, --type <type>', 'Type of component (agent, skill, connector)')
  .option('-n, --name <name>', 'Name of the component')
  .action((options) => {
    if (!options.type) {
      console.error(chalk.red('Error: Component type is required'));
      console.log(chalk.white('Usage: juliaos create -t <type> -n <name>'));
      console.log(chalk.white('Types: agent, skill, connector'));
      process.exit(1);
    }

    if (!options.name) {
      console.error(chalk.red('Error: Component name is required'));
      console.log(chalk.white('Usage: juliaos create -t <type> -n <name>'));
      process.exit(1);
    }

    console.log(chalk.green(`Creating a new ${options.type}: ${options.name}`));
    console.log(chalk.yellow('This feature is coming soon!'));
  });

// Version command
program
  .command('version')
  .description('Print the CLI version')
  .action(() => {
    console.log(`JuliaOS CLI Version: 0.1.0`);
  });

// Help command 
program
  .command('help')
  .description('Display help information')
  .action(() => {
    program.outputHelp();
  });

// Parse command-line arguments
program.parse(); 