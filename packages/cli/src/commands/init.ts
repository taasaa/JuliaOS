import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export interface ProjectConfig {
  name: string;
  description: string;
  author: string;
  license: string;
  version: string;
}

export async function init(): Promise<void> {
  try {
    const answers = await inquirer.prompt<ProjectConfig>([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: 'my-julia-project',
        validate: (input) => {
          if (!input) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Project name can only contain lowercase letters, numbers, and hyphens';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A JuliaOS project'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: ''
      },
      {
        type: 'list',
        name: 'license',
        message: 'License:',
        choices: ['MIT', 'Apache-2.0', 'GPL-3.0'],
        default: 'MIT'
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: '0.1.0'
      }
    ]);

    const spinner = ora('Initializing project...').start();
    const projectDir = path.join(process.cwd(), answers.name);

    try {
      // Create project directory
      fs.mkdirSync(projectDir, { recursive: true });
      process.chdir(projectDir);

      // Create all project files first
      spinner.text = 'Creating project files...';

      // Create package.json directly (skip npm init -y)
      const packageJson = {
        name: answers.name,
        version: answers.version,
        description: answers.description,
        author: answers.author,
        license: answers.license,
        scripts: {
          start: 'julia start',
          build: 'julia build',
          test: 'julia test',
          deploy: 'julia deploy',
          dev: 'ts-node-dev --respawn src/index.ts'
        },
        dependencies: {
          '@juliaos/core': 'workspace:*',
          '@juliaos/agents-advanced': 'workspace:*'
        },
        devDependencies: {
          '@types/jest': '^29.5.12',
          '@types/node': '^20.11.24',
          'jest': '^29.7.0',
          'ts-jest': '^29.1.2',
          'ts-node': '^10.9.2',
          'ts-node-dev': '^2.0.0',
          'typescript': '^5.3.3'
        }
      };

      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

      // Create tsconfig.json
      const tsconfig = {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          target: 'ES2020',
          module: 'CommonJS',
          moduleResolution: 'node',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          composite: true,
          declaration: true,
          sourceMap: true
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist', '**/*.test.ts']
      };

      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));

      // Create project structure
      const dirs = ['src', 'src/agents', 'src/skills', 'src/tests'];
      dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

      // Create .gitignore
      const gitignore = `node_modules/
dist/
.env
.DS_Store
coverage/
*.log`;
      fs.writeFileSync('.gitignore', gitignore);

      // Create basic index.ts
      const indexTs = `// Example agent class
export class Agent {
  constructor(private name: string) {}

  async run() {
    console.log(\`Agent \${this.name} is running...\`);
    return true;
  }
}

// Create and run an agent
const agent = new Agent("TestAgent");
agent.run().then(() => {
  console.log("Agent completed successfully!");
});`;
      fs.writeFileSync('src/index.ts', indexTs);

      // Create jest.config.js
      const jestConfig = `/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};`;
      fs.writeFileSync('jest.config.js', jestConfig);

      // Create README.md
      const readme = `# ${answers.name}

${answers.description}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the project:
\`\`\`bash
npm start
\`\`\`

## Development

- Build: \`npm run build\`
- Test: \`npm test\`
- Deploy: \`npm run deploy\`
- Dev: \`npm run dev\`

## License

${answers.license}
`;

      fs.writeFileSync('README.md', readme);

      spinner.succeed('Project initialized successfully!');
    } catch (error) {
      spinner.fail('Failed to initialize project');
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
