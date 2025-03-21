import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import * as os from 'os';

export interface StartOptions {
  strategy?: string;
  chains?: string;
}

export async function startCommand(options: StartOptions): Promise<void> {
  console.log('Starting JuliaOS trading system...');
  
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
  
  // Create process ID file
  const pidFile = path.join(process.cwd(), '.juliaos', 'juliaos.pid');
  ensureDirectoryExists(path.dirname(pidFile));
  
  // Check if already running
  if (isProcessRunning(pidFile)) {
    console.error('Error: JuliaOS is already running. Use "juliaos stop" to stop it first.');
    process.exit(1);
  }
  
  // Start the process
  try {
    // Prepare command arguments
    const args = ['start'];
    if (options.strategy) {
      args.push('--strategy', options.strategy);
    }
    if (options.chains) {
      args.push('--chains', options.chains);
    }
    
    // Use node to run the start script
    const startScriptPath = path.join(process.cwd(), 'node_modules', '.bin', 'ts-node');
    const entryPoint = path.join(process.cwd(), 'src', 'index.ts');
    
    // Start as detached process
    const child = child_process.spawn(
      startScriptPath,
      [entryPoint, ...args],
      {
        detached: true,
        stdio: 'ignore',
        env: process.env,
      }
    );
    
    // Allow the process to continue running without the parent
    child.unref();
    
    // Save PID for later management
    fs.writeFileSync(pidFile, child.pid?.toString() || '');
    
    console.log(`JuliaOS started successfully! (PID: ${child.pid})`);
    console.log('Use "juliaos status" to check system status');
    console.log('Use "juliaos logs" to view logs');
    console.log('Use "juliaos stop" to stop the system');
    
  } catch (error) {
    console.error('Error starting JuliaOS:', error.message);
    process.exit(1);
  }
}

function isProjectInitialized(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'package.json'));
}

function isEnvironmentConfigured(): boolean {
  return fs.existsSync(path.join(process.cwd(), '.env'));
}

function isProcessRunning(pidFile: string): boolean {
  if (!fs.existsSync(pidFile)) {
    return false;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
  if (isNaN(pid)) {
    return false;
  }
  
  try {
    // Try to send signal 0 to the process to check if it exists
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // Process doesn't exist
    return false;
  }
}

function ensureDirectoryExists(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
} 