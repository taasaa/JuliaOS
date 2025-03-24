import { Command } from 'commander';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let juliaProcess: ChildProcess | null = null;

/**
 * Start the Julia server
 */
async function startJuliaServer(port: number = 3000, options: any = {}) {
  try {
    // Check if Julia is installed
    if (!await isJuliaInstalled()) {
      console.log(chalk.red('Julia is not installed or not in PATH'));
      console.log(chalk.yellow('Please install Julia from https://julialang.org/downloads/'));
      return;
    }

    // Find the server script
    const serverScriptPath = findServerScript();
    if (!serverScriptPath) {
      console.log(chalk.red('Server script not found'));
      console.log(chalk.yellow('Please ensure julia/src/server.jl exists in the project'));
      return;
    }

    // Start Julia process
    console.log(chalk.blue(`Starting Julia server on port ${port}...`));
    
    const args = [serverScriptPath, '--port', port.toString()];
    
    if (options.debug) {
      args.push('--debug');
    }
    
    // Set up environment variables for the Julia process
    const env = { ...process.env };
    if (process.env.JULIA_DEPOT_PATH) {
      env.JULIA_DEPOT_PATH = process.env.JULIA_DEPOT_PATH;
    }
    if (process.env.JULIA_PROJECT) {
      env.JULIA_PROJECT = process.env.JULIA_PROJECT;
    }
    
    // Use WEB3 environment variables if available
    if (process.env.WEB3_PROVIDER) {
      env.WEB3_PROVIDER = process.env.WEB3_PROVIDER;
    }
    if (process.env.WALLET_PRIVATE_KEY) {
      env.WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    }
    
    // Add any AI/LLM API keys
    if (process.env.OPENAI_API_KEY) {
      env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    }
    
    juliaProcess = spawn('julia', args, {
      stdio: 'pipe',
      cwd: process.cwd(),
      env
    });

    juliaProcess.stdout?.on('data', (data) => {
      console.log(chalk.green(`[Julia] ${data.toString().trim()}`));
    });

    juliaProcess.stderr?.on('data', (data) => {
      console.error(chalk.red(`[Julia Error] ${data.toString().trim()}`));
    });

    juliaProcess.on('close', (code) => {
      console.log(chalk.yellow(`Julia server process exited with code ${code}`));
      juliaProcess = null;
    });

    console.log(chalk.green('Julia server started successfully'));
    console.log(chalk.white('Press Ctrl+C to stop the server'));
    
    // Keep the process running
    process.on('SIGINT', () => {
      stopJuliaServer();
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red('Failed to start Julia server:'), error);
  }
}

/**
 * Stop the Julia server
 */
function stopJuliaServer() {
  if (juliaProcess) {
    console.log(chalk.blue('Stopping Julia server...'));
    juliaProcess.kill();
    juliaProcess = null;
    console.log(chalk.green('Julia server stopped'));
  } else {
    console.log(chalk.yellow('No Julia server is running'));
  }
}

/**
 * Check if Julia is installed
 */
async function isJuliaInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('julia', ['--version']);
    
    process.on('error', () => {
      resolve(false);
    });
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Find the server script path
 */
function findServerScript(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'julia', 'src', 'server.jl'),
    path.join(process.cwd(), 'src', 'server.jl'),
    path.join(process.cwd(), 'server.jl')
  ];
  
  for (const scriptPath of possiblePaths) {
    if (fs.existsSync(scriptPath)) {
      return scriptPath;
    }
  }
  
  return null;
}

/**
 * Install Julia packages
 */
async function installJuliaPackages() {
  try {
    // Check if Julia is installed
    if (!await isJuliaInstalled()) {
      console.log(chalk.red('Julia is not installed or not in PATH'));
      console.log(chalk.yellow('Please install Julia from https://julialang.org/downloads/'));
      return;
    }

    // Find the setup script
    const setupScriptPath = path.join(process.cwd(), 'julia', 'setup.jl');
    if (!fs.existsSync(setupScriptPath)) {
      console.log(chalk.red('Setup script not found'));
      console.log(chalk.yellow('Please ensure julia/setup.jl exists in the project'));
      return;
    }

    console.log(chalk.blue('Installing Julia packages...'));
    
    const juliaProcess = spawn('julia', [setupScriptPath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    juliaProcess.stdout?.on('data', (data) => {
      console.log(chalk.green(`[Julia] ${data.toString().trim()}`));
    });

    juliaProcess.stderr?.on('data', (data) => {
      console.error(chalk.red(`[Julia Error] ${data.toString().trim()}`));
    });

    juliaProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Julia packages installed successfully'));
      } else {
        console.log(chalk.red(`Failed to install Julia packages (exit code: ${code})`));
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to install Julia packages:'), error);
  }
}

/**
 * Run a Julia script
 */
async function runJuliaScript(scriptPath: string) {
  try {
    // Check if Julia is installed
    if (!await isJuliaInstalled()) {
      console.log(chalk.red('Julia is not installed or not in PATH'));
      console.log(chalk.yellow('Please install Julia from https://julialang.org/downloads/'));
      return;
    }

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.log(chalk.red(`Script not found: ${scriptPath}`));
      return;
    }

    console.log(chalk.blue(`Running Julia script: ${scriptPath}`));
    
    const juliaProcess = spawn('julia', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    juliaProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Script completed successfully'));
      } else {
        console.log(chalk.red(`Script failed with exit code: ${code}`));
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to run Julia script:'), error);
  }
}

/**
 * Set up Julia bridge
 */
async function setupJuliaBridge() {
  try {
    console.log(chalk.blue('Setting up Julia bridge...'));
    
    // Ensure julia bridge directories exist
    const bridgeDirs = [
      path.join(process.cwd(), 'packages', 'julia-bridge', 'src'),
      path.join(process.cwd(), 'julia', 'src')
    ];
    
    for (const dir of bridgeDirs) {
      if (!fs.existsSync(dir)) {
        console.log(chalk.red(`Directory not found: ${dir}`));
        console.log(chalk.yellow('Please ensure the project structure is correct'));
        return;
      }
    }
    
    // Install Julia packages
    await installJuliaPackages();
    
    // Test bridge connection
    console.log(chalk.blue('Testing bridge connection...'));
    const testScriptPath = path.join(process.cwd(), 'test_bridge.jl');
    
    const juliaProcess = spawn('julia', [testScriptPath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    juliaProcess.stdout?.on('data', (data) => {
      console.log(chalk.green(`[Julia] ${data.toString().trim()}`));
    });

    juliaProcess.stderr?.on('data', (data) => {
      console.error(chalk.red(`[Julia Error] ${data.toString().trim()}`));
    });

    juliaProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('Julia bridge set up successfully'));
      } else {
        console.log(chalk.red(`Failed to set up Julia bridge (exit code: ${code})`));
      }
    });
  } catch (error) {
    console.error(chalk.red('Failed to set up Julia bridge:'), error);
  }
}

/**
 * Register the Julia command
 */
export function registerJuliaCommand(program: Command): void {
  const juliaCommand = program
    .command('julia')
    .description('Julia integration commands');

  juliaCommand
    .command('start')
    .description('Start the Julia server')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('-d, --debug', 'Enable debug mode')
    .action((options) => {
      startJuliaServer(parseInt(options.port), { debug: options.debug });
    });

  juliaCommand
    .command('stop')
    .description('Stop the Julia server')
    .action(() => {
      stopJuliaServer();
    });

  juliaCommand
    .command('install')
    .description('Install Julia packages')
    .action(() => {
      installJuliaPackages();
    });

  juliaCommand
    .command('run <script>')
    .description('Run a Julia script')
    .action((script) => {
      runJuliaScript(script);
    });

  juliaCommand
    .command('setup-bridge')
    .description('Set up the TypeScript-Julia bridge')
    .action(() => {
      setupJuliaBridge();
    });
} 