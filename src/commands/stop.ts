import * as fs from 'fs';
import * as path from 'path';

export async function stopCommand(): Promise<void> {
  console.log('Stopping JuliaOS trading system...');
  
  // Check for PID file
  const pidFile = path.join(process.cwd(), '.juliaos', 'juliaos.pid');
  
  if (!fs.existsSync(pidFile)) {
    console.log('JuliaOS is not running.');
    return;
  }
  
  // Read PID
  const pidStr = fs.readFileSync(pidFile, 'utf8');
  const pid = parseInt(pidStr, 10);
  
  if (isNaN(pid)) {
    console.error('Invalid PID in file. Removing file...');
    fs.unlinkSync(pidFile);
    return;
  }
  
  // Try to kill process
  try {
    console.log(`Sending termination signal to process ${pid}...`);
    process.kill(pid, 'SIGTERM');
    
    // Wait for process to exit
    let attempts = 0;
    const maxAttempts = 10;
    
    while (isProcessRunning(pid) && attempts < maxAttempts) {
      await sleep(500);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('Process did not terminate gracefully, forcing termination...');
      process.kill(pid, 'SIGKILL');
    }
    
    // Remove PID file
    fs.unlinkSync(pidFile);
    console.log('JuliaOS stopped successfully.');
  } catch (error) {
    console.error(`Error stopping JuliaOS: ${error.message}`);
    
    // Process might not exist anymore, clean up PID file
    if (error.code === 'ESRCH') {
      console.log('Process not found. Cleaning up...');
      fs.unlinkSync(pidFile);
    }
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    // Try to send signal 0 to check if process exists
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 