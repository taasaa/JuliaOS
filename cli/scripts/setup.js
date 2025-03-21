#!/usr/bin/env node

/**
 * Post-installation setup script for the JuliaOS CLI
 * This creates a cross-platform entry point for the CLI
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const cliPath = path.join(__dirname, '..');
const binPath = path.join(cliPath, 'bin');
const entryPointPath = path.join(binPath, 'j3os.js');

// Create the entry point script
const entryPointContent = isWindows
  ? `#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const psScriptPath = path.join(__dirname, '..', 'j3os.ps1');

// Run the PowerShell script using the system's PowerShell
const result = spawnSync('powershell', [
  '-ExecutionPolicy', 
  'Bypass', 
  '-File', 
  psScriptPath,
  ...args
], { 
  stdio: 'inherit' 
});

process.exit(result.status);`
  : `#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const shScriptPath = path.join(__dirname, '..', 'j3os.sh');

// Make sure the shell script is executable
require('fs').chmodSync(shScriptPath, '755');

// Run the bash script
const result = spawnSync('bash', [
  shScriptPath,
  ...args
], { 
  stdio: 'inherit' 
});

process.exit(result.status);`;

try {
  // Create bin directory if it doesn't exist
  if (!fs.existsSync(binPath)) {
    fs.mkdirSync(binPath, { recursive: true });
  }

  // Write the entry point script
  fs.writeFileSync(entryPointPath, entryPointContent);

  // Make the script executable on Unix systems
  if (!isWindows) {
    fs.chmodSync(entryPointPath, '755');
  }

  console.log('JuliaOS CLI setup completed successfully!');
  console.log('You can now use the CLI with the command: j3os');
} catch (error) {
  console.error('Error during JuliaOS CLI setup:', error);
  process.exit(1);
} 