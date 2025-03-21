#!/usr/bin/env node

/**
 * This is a fallback entry point for the JuliaOS CLI
 * The real entry point is created by the setup.js script
 */

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const args = process.argv.slice(2);

if (isWindows) {
  // For Windows, use PowerShell
  const psScriptPath = path.join(__dirname, '..', 'j3os.ps1');
  const result = spawnSync('powershell', [
    '-ExecutionPolicy', 
    'Bypass', 
    '-File', 
    psScriptPath,
    ...args
  ], { 
    stdio: 'inherit' 
  });
  process.exit(result.status);
} else {
  // For Mac/Linux, use Bash
  const shScriptPath = path.join(__dirname, '..', 'j3os.sh');
  
  // Make sure the shell script is executable
  require('fs').chmodSync(shScriptPath, '755');
  
  const result = spawnSync('bash', [
    shScriptPath,
    ...args
  ], { 
    stdio: 'inherit' 
  });
  process.exit(result.status);
} 