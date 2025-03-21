import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export async function devCommand(): Promise<void> {
  console.log('Starting JuliaOS in development mode...');
  
  // Check if project is initialized
  if (!isProjectInitialized()) {
    console.error('Error: JuliaOS project not initialized. Run "juliaos init" first.');
    process.exit(1);
  }
  
  // Check for environment configuration
  if (!isEnvironmentConfigured()) {
    console.log('Environment not configured. Running configuration wizard...');
    // Dynamically import to avoid circular dependencies
    const { configCommand } = await import('./config');
    await configCommand({ type: 'env' });
  }
  
  // Run ts-node-dev for hot-reloading
  try {
    const nodemonPath = path.join(process.cwd(), 'node_modules', '.bin', 'ts-node-dev');
    const entryPoint = path.join(process.cwd(), 'src', 'index.ts');
    
    // Check if ts-node-dev is installed, otherwise use ts-node
    const devDependency = fs.existsSync(nodemonPath) ? nodemonPath : 
      path.join(process.cwd(), 'node_modules', '.bin', 'ts-node');
    
    // Start development process
    const args = [
      '--respawn',
      '--transpile-only',
      '--watch',
      'src',
      entryPoint,
      'dev'
    ];
    
    console.log(`Running: ${devDependency} ${args.join(' ')}`);
    
    // Run the process in foreground
    const child = child_process.spawn(
      devDependency,
      args,
      {
        stdio: 'inherit',
        env: process.env,
      }
    );
    
    // Handle process exit
    child.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`Process exited with code ${code} and signal ${signal}`);
      }
      process.exit(code || 0);
    });
    
    // Handle interruption
    process.on('SIGINT', () => {
      console.log('\nStopping development server...');
      child.kill('SIGINT');
    });
    
  } catch (error) {
    console.error('Error starting development server:', error.message);
    process.exit(1);
  }
}

function isProjectInitialized(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'package.json'));
}

function isEnvironmentConfigured(): boolean {
  return fs.existsSync(path.join(process.cwd(), '.env'));
} 