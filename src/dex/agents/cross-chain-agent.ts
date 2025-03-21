import { Agent } from '../../core/agent/base';
import { MarketDataService } from '../market-data';

export interface CrossChainAgentConfig {
  name: string;
  description?: string;
  strategy: string;
  chains: string[];
  maxPositionSize: string;
  maxTotalExposure: string;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
}

export interface TradingOpportunity {
  token: string;
  chainId: string;
  price: number;
  signal: 'buy' | 'sell';
  confidence: number;
  optimalSize: string;
  expectedProfit: number;
  buyChain?: string;
  sellChain?: string;
  pair?: string;
}

export interface Position {
  chain: string;
  tokenPair: string;
  amount: string;
  entryPrice: number;
  timestamp: number;
  pnl?: number;
  currentPrice?: number;
}

export interface TradeResult {
  success: boolean;
  txHash: string;
  chain?: string;
}

/**
 * Agent that specializes in cross-chain trading
 */
export class CrossChainAgent extends Agent {
  private positions: Record<string, Position[]> = {};
  private marketDataService: MarketDataService;
  private crossChainService: any;
  private config: CrossChainAgentConfig;

  constructor(
    config: CrossChainAgentConfig, 
    crossChainService: any, 
    marketDataService: MarketDataService
  ) {
    super({
      name: config.name,
      description: config.description || `Cross-chain trading agent using ${config.strategy} strategy`,
      llmProvider: 'openai',
      systemPrompt: `You are a trading agent specializing in ${config.strategy} trading across ${config.chains.join(', ')}`,
      maxRetries: 3
    });

    this.config = config;
    this.crossChainService = crossChainService;
    this.marketDataService = marketDataService;
    
    // Initialize positions store
    this.config.chains.forEach(chain => {
      this.positions[chain] = [];
    });
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    
    // Initialize market data monitoring
    await this.initializeMarketDataMonitoring();
    
    this.emit('initialized', { agent: this.getConfig().name });
  }

  async processMessage(message: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    if (message.includes('analyze market')) {
      const opportunities = await this.analyzeOpportunities();
      return this.formatOpportunities(opportunities);
    }
    
    if (message.includes('show positions')) {
      return this.formatPositions();
    }
    
    if (message.includes('execute trades')) {
      const result = await this.executeTrades();
      return `Executed ${result.length} trades`;
    }
    
    return `Received message: ${message}`;
  }

  /**
   * Initialize market data monitoring
   */
  private async initializeMarketDataMonitoring(): Promise<void> {
    // Subscribe to market updates
    this.marketDataService.on('update', this.onMarketUpdate.bind(this));
  }

  /**
   * Handle market data updates
   */
  private async onMarketUpdate(data: any): Promise<void> {
    this.emit('market-update', data);
    
    // In a real implementation, this would analyze opportunities and execute trades
  }

  /**
   * Analyze trading opportunities based on market data
   */
  async analyzeOpportunities(): Promise<TradingOpportunity[]> {
    // In a real implementation, this would analyze cross-chain price differences
    // and identify arbitrage opportunities
    
    // Mock implementation
    return [{
      token: 'ETH',
      chainId: 'ethereum',
      price: 3000,
      signal: 'buy',
      confidence: 0.85,
      optimalSize: '1.0',
      expectedProfit: 50,
      buyChain: 'ethereum',
      sellChain: 'solana',
      pair: 'ETH/USDC'
    }];
  }

  /**
   * Execute trades based on identified opportunities
   */
  async executeTrades(): Promise<TradeResult[]> {
    const opportunities = await this.analyzeOpportunities();
    
    const results = [];
    
    for (const opportunity of opportunities) {
      if (opportunity.confidence > 0.8) {
        const result = await this.executeTrade({
          tokenPair: opportunity.pair || `${opportunity.token}/USDC`,
          amount: opportunity.optimalSize,
          type: opportunity.signal,
          chain: opportunity.chainId
        });
        
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Execute a specific trade
   */
  async executeTrade(params: {
    tokenPair: string;
    amount: string;
    type: 'buy' | 'sell';
    chain: string;
  }): Promise<TradeResult> {
    // In a real implementation, this would execute the trade
    // through the appropriate chain's trading service
    
    // Mock implementation
    return {
      success: true,
      txHash: `mock_tx_${Date.now()}`,
      chain: params.chain
    };
  }

  /**
   * Add a position to the agent's portfolio
   */
  async addPosition(position: Position): Promise<void> {
    if (!this.positions[position.chain]) {
      this.positions[position.chain] = [];
    }
    
    this.positions[position.chain].push(position);
    this.emit('position-added', position);
  }

  /**
   * Get all positions across chains
   */
  getPositions(): Record<string, Position[]> {
    return this.positions;
  }

  /**
   * Format opportunities for display
   */
  private formatOpportunities(opportunities: TradingOpportunity[]): string {
    if (opportunities.length === 0) {
      return 'No trading opportunities found';
    }
    
    return opportunities.map(opp => 
      `${opp.signal.toUpperCase()} ${opp.token} on ${opp.chainId} at $${opp.price} (${opp.confidence * 100}% confidence)`
    ).join('\n');
  }

  /**
   * Format positions for display
   */
  private formatPositions(): string {
    let result = '';
    
    for (const [chain, positions] of Object.entries(this.positions)) {
      if (positions.length === 0) continue;
      
      result += `${chain.toUpperCase()} positions:\n`;
      
      for (const pos of positions) {
        result += `- ${pos.amount} ${pos.tokenPair} @ $${pos.entryPrice}\n`;
      }
      
      result += '\n';
    }
    
    return result || 'No open positions';
  }
} 