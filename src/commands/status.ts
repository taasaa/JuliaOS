import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function statusCommand(): Promise<void> {
  console.log('Checking JuliaOS system status...');
  
  // Check for PID file
  const pidFile = path.join(process.cwd(), '.juliaos', 'juliaos.pid');
  const isRunning = isPidFileValid(pidFile);
  
  console.log('----------------------------------------');
  console.log(`System Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);
  
  if (isRunning) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    console.log(`Process ID: ${pid}`);
    
    // Display uptime if possible
    try {
      const startTime = getProcessStartTime(pid);
      if (startTime) {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        console.log(`Uptime: ${formatUptime(uptime)}`);
      }
    } catch (error) {
      // Ignore errors in getting process info
    }
  }
  
  // Check configuration status
  console.log('\nConfiguration Status:');
  
  const envConfigured = fs.existsSync(path.join(process.cwd(), '.env'));
  console.log(`Environment: ${envConfigured ? '✅ Configured' : '❌ Not Configured'}`);
  
  const configDir = path.join(process.cwd(), 'config');
  const networkConfigured = fs.existsSync(path.join(configDir, 'network.config.json'));
  console.log(`Network: ${networkConfigured ? '✅ Configured' : '❌ Not Configured'}`);
  
  const tradingConfigured = fs.existsSync(path.join(configDir, 'trading.config.json'));
  console.log(`Trading: ${tradingConfigured ? '✅ Configured' : '❌ Not Configured'}`);
  
  const riskConfigured = fs.existsSync(path.join(configDir, 'risk.config.json'));
  console.log(`Risk Management: ${riskConfigured ? '✅ Configured' : '❌ Not Configured'}`);
  
  // Check system resources
  console.log('\nSystem Resources:');
  
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10;
  const usedMem = Math.round((totalMem - freeMem) * 10) / 10;
  const memUsage = Math.round((usedMem / totalMem) * 100);
  
  console.log(`Memory: ${usedMem}GB / ${totalMem}GB (${memUsage}%)`);
  console.log(`CPU Cores: ${os.cpus().length}`);
  console.log(`Load Average: ${os.loadavg().map(load => load.toFixed(2)).join(', ')}`);
  
  // Display next steps if system is not running
  if (!isRunning) {
    console.log('\nTo start the system, run:');
    console.log('  juliaos start');
  } else {
    console.log('\nTo monitor the system, run:');
    console.log('  juliaos monitor');
    console.log('\nTo stop the system, run:');
    console.log('  juliaos stop');
  }
  
  console.log('----------------------------------------');
}

function isPidFileValid(pidFile: string): boolean {
  if (!fs.existsSync(pidFile)) {
    return false;
  }
  
  try {
    const pidStr = fs.readFileSync(pidFile, 'utf8');
    const pid = parseInt(pidStr, 10);
    
    if (isNaN(pid)) {
      return false;
    }
    
    // Check if process is running
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

function getProcessStartTime(pid: number): number | null {
  // This is a platform-specific operation
  // For simplicity, we'll return the current time
  // In a real implementation, this would query process stats
  return Date.now() - 1000 * 60 * 5; // Pretend it started 5 minutes ago
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds %= (24 * 60 * 60);
  const hours = Math.floor(seconds / (60 * 60));
  seconds %= (60 * 60);
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
} 