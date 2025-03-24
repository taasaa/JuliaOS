#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { registerDefiCommand } from './commands/defi';
import { registerJuliaCommand } from './commands/julia';
import { registerMonitorCommand } from './commands/monitor';

/**
 * JuliaOS CLI - Main entry point
 * Version: 0.1.0
 */

// Define the program
const program = new Command();

// Setup main program info
program
  .name('j3os')
  .description('JuliaOS Framework CLI - Create and manage AI-powered trading agents and swarms')
  .version('0.1.0')
  .addHelpText('after', `
Examples:
  $ j3os init --name my-defi-project
  $ j3os defi create-swarm
  $ j3os julia bridge --start
  $ j3os monitor trade-performance
  `);

// Register all command groups with consistent naming and structure
registerDefiCommand(program);
registerJuliaCommand(program);
registerMonitorCommand(program);

// Global project initialization command
program
  .command('init')
  .description('Initialize a new JuliaOS project')
  .option('-n, --name <name>', 'Name of the project')
  .option('-t, --template <template>', 'Project template (default: basic)', 'basic')
  .option('-d, --directory <directory>', 'Target directory (default: current directory)')
  .action(async (options) => {
    const projectName = options.name || 'juliaos-project';
    const targetDir = options.directory || projectName;
    const template = options.template;
    
    console.log(chalk.blue(`Creating a new JuliaOS project: ${projectName} (${template} template)`));
    
    try {
      // Create project directory
      await fs.ensureDir(targetDir);
      
      // Create basic structure
      await fs.ensureDir(path.join(targetDir, 'src'));
      await fs.ensureDir(path.join(targetDir, 'src', 'agents'));
      await fs.ensureDir(path.join(targetDir, 'src', 'skills'));
      await fs.ensureDir(path.join(targetDir, 'test'));
      
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
      
      await fs.writeJSON(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });
      
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
      
      await fs.writeJSON(path.join(targetDir, 'tsconfig.json'), tsconfig, { spaces: 2 });
      
      // Create README.md
      const readme = `# ${projectName}\n\nA JuliaOS Framework project\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run build\nnpm start\n\`\`\`\n`;
      await fs.writeFile(path.join(targetDir, 'README.md'), readme);
      
      // Create .gitignore
      const gitignore = `node_modules/\ndist/\n.env\n.DS_Store\n`;
      await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore);
      
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
      
      await fs.writeFile(path.join(targetDir, 'src', 'agents', 'SampleAgent.ts'), sampleAgent);
      
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
      
      await fs.writeFile(path.join(targetDir, 'src', 'index.ts'), mainIndex);
      
      console.log(chalk.green(`Project "${projectName}" created successfully in ${targetDir}`));
      console.log(chalk.blue(`
Next steps:
  cd ${targetDir}
  npm install
  npm run build
  npm start
      `));
    } catch (error: any) {
      console.error(chalk.red(`Error creating project: ${error.message}`));
    }
  });

// Global utility commands
program
  .command('version')
  .description('Display version information')
  .action(() => {
    console.log(`JuliaOS CLI version: 0.1.0`);
  });

program
  .command('help-all')
  .description('Display detailed help for all commands')
  .action(() => {
    program.help();
  });

// Parse arguments
program.parse(process.argv); 