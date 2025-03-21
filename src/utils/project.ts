import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';

/**
 * Creates a new project with the specified name and template
 * @param name The name of the project to create
 * @param template The template to use for the project
 */
export async function createProject(name: string, template: string = 'default'): Promise<void> {
  const spinner = ora('Creating project...').start();

  try {
    // Create project directory
    const projectPath = path.join(process.cwd(), name);
    await fs.mkdirp(projectPath);
    process.chdir(projectPath);

    // Initialize npm project
    execSync('npm init -y', { stdio: 'ignore' });

    // Update package.json with project info
    const packageJson = await fs.readJson('package.json');
    packageJson.name = name;
    await fs.writeJson('package.json', packageJson, { spaces: 2 });

    // Create project structure based on template
    await createProjectStructure(template);

    // Install dependencies
    execSync('npm install', { stdio: 'ignore' });

    spinner.succeed('Project created successfully!');
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

async function createProjectStructure(template: string): Promise<void> {
  // Create basic directory structure
  const directories = ['src', 'src/agents', 'src/skills', 'src/tests'];
  
  for (const dir of directories) {
    await fs.mkdirp(dir);
  }

  // Create basic files
  await fs.writeFile('README.md', generateReadme());
  await fs.writeFile('tsconfig.json', generateTsConfig());
  await fs.writeFile('src/index.ts', generateIndexFile());

  // Add template-specific files
  if (template !== 'default') {
    // TODO: Implement template-specific logic
  }
}

function generateReadme(): string {
  return `# Project Name

A JuliaOS project.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the project:
   \`\`\`bash
   npm start
   \`\`\`
`;
}

function generateTsConfig(): string {
  return JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src'
    },
    include: ['src/**/*']
  }, null, 2);
}

function generateIndexFile(): string {
  return `// Main entry point for your JuliaOS project
console.log('Hello from JuliaOS!');
`;
} 