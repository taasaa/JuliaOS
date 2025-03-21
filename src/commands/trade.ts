import * as fs from 'fs';
import * as path from 'path';

interface TradeOptions {
  token: string;
  amount: string;
  type: 'buy' | 'sell';
}

export async function tradeCommand(options: TradeOptions): Promise<void> {
  const { token, amount, type } = options;
  
  console.log(`Executing ${type} trade for ${amount} of ${token}...`);
  
  // Check if system is running
  const pidFile = path.join(process.cwd(), '.juliaos', 'juliaos.pid');
  if (!fs.existsSync(pidFile)) {
    console.error('Error: JuliaOS is not running. Start it first with "juliaos start".');
    process.exit(1);
  }
  
  // Parse token pair
  const [baseToken, quoteToken] = token.split('/');
  if (!baseToken || !quoteToken) {
    console.error('Error: Invalid token pair format. Use format like "SOL/USDC".');
    process.exit(1);
  }
  
  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    console.error('Error: Invalid amount. Must be a positive number.');
    process.exit(1);
  }
  
  // Execute mock trade
  try {
    const result = await executeTrade({
      baseToken,
      quoteToken,
      amount: amountNum,
      type,
    });
    
    // Display result
    console.log('\nTrade executed successfully!');
    console.log('----------------------------------------');
    console.log(`Transaction ID: ${result.txId}`);
    console.log(`Price: ${result.price} ${quoteToken}`);
    console.log(`Total: ${result.total} ${quoteToken}`);
    console.log(`Fee: ${result.fee} ${quoteToken}`);
    console.log(`Chain: ${result.chain}`);
    console.log(`DEX: ${result.dex}`);
    console.log(`Status: ${result.status}`);
    console.log('----------------------------------------');
    
    // Save trade to history (mock)
    saveTradeToHistory(result);
    
  } catch (error) {
    console.error(`Error executing trade: ${error.message}`);
    process.exit(1);
  }
}

interface TradeParams {
  baseToken: string;
  quoteToken: string;
  amount: number;
  type: 'buy' | 'sell';
}

interface TradeResult {
  txId: string;
  price: string;
  total: string;
  fee: string;
  chain: string;
  dex: string;
  status: string;
  timestamp: number;
}

async function executeTrade(params: TradeParams): Promise<TradeResult> {
  // In a real implementation, this would execute the trade through the running system
  // For now, return mock result
  
  // Generate mock price (between 10 and 100)
  const price = (Math.random() * 90 + 10).toFixed(2);
  const total = (params.amount * parseFloat(price)).toFixed(2);
  const fee = (parseFloat(total) * 0.01).toFixed(2); // 1% fee
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    txId: `tx_${Math.random().toString(36).substring(2, 15)}`,
    price,
    total,
    fee,
    chain: 'solana', // Default to Solana as per project focus
    dex: 'raydium',
    status: 'completed',
    timestamp: Date.now(),
  };
}

function saveTradeToHistory(trade: TradeResult): void {
  // Create directory for trade history
  const historyDir = path.join(process.cwd(), '.juliaos', 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  
  // Load existing history or create new
  const historyFile = path.join(historyDir, 'trades.json');
  let history: TradeResult[] = [];
  
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      // If file is corrupted, start with empty history
      console.warn('Trade history file corrupted, creating new history.');
    }
  }
  
  // Add new trade and save
  history.push(trade);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
} 