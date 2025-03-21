import * as fs from 'fs';
import * as path from 'path';

interface PositionsOptions {
  chain?: string;
}

interface Position {
  id: string;
  token: string;
  amount: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  pnlPercent: string;
  chain: string;
  status: string;
  openTime: number;
}

// Sample positions for demonstration
const mockPositions: Position[] = [
  {
    id: 'pos_1',
    token: 'SOL/USDC',
    amount: '5.0',
    entryPrice: '24.50',
    currentPrice: '26.75',
    pnl: '+11.25',
    pnlPercent: '+9.18%',
    chain: 'solana',
    status: 'open',
    openTime: Date.now() - 3600000 * 12, // 12 hours ago
  },
  {
    id: 'pos_2',
    token: 'ETH/USDC',
    amount: '0.25',
    entryPrice: '1850.75',
    currentPrice: '1832.20',
    pnl: '-4.64',
    pnlPercent: '-1.00%',
    chain: 'ethereum',
    status: 'open',
    openTime: Date.now() - 3600000 * 36, // 36 hours ago
  },
  {
    id: 'pos_3',
    token: 'OP/USDC',
    amount: '50.0',
    entryPrice: '2.75',
    currentPrice: '3.05',
    pnl: '+15.00',
    pnlPercent: '+10.91%',
    chain: 'base',
    status: 'open',
    openTime: Date.now() - 3600000 * 24, // 24 hours ago
  },
];

export async function positionsCommand(options: PositionsOptions): Promise<void> {
  console.log('Retrieving open positions...');
  
  // Check if system is running
  const pidFile = path.join(process.cwd(), '.juliaos', 'juliaos.pid');
  if (!fs.existsSync(pidFile)) {
    console.error('Error: JuliaOS is not running. Start it first with "juliaos start".');
    process.exit(1);
  }
  
  // Get positions
  let positions = await getPositions();
  
  // Filter by chain if specified
  if (options.chain) {
    const chain = options.chain.toLowerCase();
    positions = positions.filter(pos => pos.chain === chain);
    
    if (positions.length === 0) {
      console.log(`No open positions found on chain: ${options.chain}`);
      return;
    }
  }
  
  if (positions.length === 0) {
    console.log('No open positions found.');
    return;
  }
  
  // Display positions
  console.log('\nOpen Positions:');
  console.log('----------------------------------------');
  
  positions.forEach((position, index) => {
    if (index > 0) {
      console.log('----------------------------------------');
    }
    
    console.log(`ID: ${position.id}`);
    console.log(`Token: ${position.token}`);
    console.log(`Amount: ${position.amount}`);
    console.log(`Entry Price: ${position.entryPrice} USDC`);
    console.log(`Current Price: ${position.currentPrice} USDC`);
    
    // Color the PnL based on whether it's positive or negative
    const pnlIsPositive = position.pnl.startsWith('+');
    console.log(`PnL: ${position.pnl} USDC (${position.pnlPercent})`);
    
    console.log(`Chain: ${position.chain}`);
    console.log(`Status: ${position.status}`);
    console.log(`Open Time: ${formatDate(position.openTime)}`);
  });
  
  console.log('----------------------------------------');
  
  // Display summary
  const totalPositions = positions.length;
  const totalInvestment = positions.reduce((sum, pos) => 
    sum + parseFloat(pos.amount) * parseFloat(pos.entryPrice), 0).toFixed(2);
  
  const totalPnL = positions.reduce((sum, pos) => {
    const pnl = parseFloat(pos.pnl.replace('+', '').replace('-', ''));
    return pos.pnl.startsWith('-') ? sum - pnl : sum + pnl;
  }, 0).toFixed(2);
  
  const pnlPrefix = totalPnL.startsWith('-') ? '' : '+';
  
  console.log(`\nSummary: ${totalPositions} positions, Total Value: ${totalInvestment} USDC, Total PnL: ${pnlPrefix}${totalPnL} USDC`);
}

async function getPositions(): Promise<Position[]> {
  // In a real implementation, this would fetch positions from the running system
  // For now, we'll return mock positions
  return mockPositions;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
} 