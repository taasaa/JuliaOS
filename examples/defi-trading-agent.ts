import { BaseAgent } from '../packages/core/src/agent/BaseAgent';
import { DiscordConnector } from '../packages/platforms/discord/src';
import { DeFiTradingSkill } from '../packages/core/src/skills/DeFiTradingSkill';
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Create Discord platform
    const discord = new DiscordConnector({
      name: 'trading-bot',
      type: 'discord',
      parameters: {
        token: process.env.DISCORD_TOKEN!,
        commandPrefix: '!',
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      }
    });

    // Create DeFi trading skill
    const tradingSkill = new DeFiTradingSkill({
      name: 'defi-trading',
      type: 'trading',
      parameters: {
        tradingPairs: ['ETH/USDC', 'SOL/USDC'],
        swarmSize: 100,
        algorithm: 'pso',
        riskParameters: {
          maxPositionSize: 1.0,
          stopLoss: 5.0,
          takeProfit: 10.0,
          maxDrawdown: 20.0
        }
      }
    });

    // Create agent
    const agent = new BaseAgent({
      name: 'defi-trading-agent',
      type: 'trading',
      platforms: [discord],
      skills: [tradingSkill]
    });

    // Initialize agent
    console.log('Initializing DeFi trading agent...');
    await agent.initialize();

    // Set up message handlers
    discord.on('message', async (data) => {
      try {
        // Process market data from message
        const marketData = parseMarketData(data.content);
        if (marketData) {
          // Get trading signals from Julia swarm
          const signals = await tradingSkill.execute(marketData);
          
          // Format and send response
          const response = formatTradingSignals(signals);
          await discord.sendMessage(response, data.channelId);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await discord.sendMessage('Error processing market data', data.channelId);
      }
    });

    // Start agent
    console.log('Starting DeFi trading agent...');
    await agent.start();

    console.log('\nDeFi trading agent is running!');
    console.log('Send market data in the format: "ETH/USDC 2000.50 1000"');
    console.log('Press Ctrl+C to stop the agent.\n');

  } catch (error) {
    console.error('Failed to start DeFi trading agent:', error);
    process.exit(1);
  }
}

function parseMarketData(content: string) {
  try {
    const [symbol, price, volume] = content.split(' ');
    if (!symbol || !price || !volume) return null;

    return {
      symbol,
      price: parseFloat(price),
      volume: parseFloat(volume),
      timestamp: new Date()
    };
  } catch (error) {
    return null;
  }
}

function formatTradingSignals(signals: any) {
  return `Trading Signals:
Action: ${signals.action}
Amount: ${signals.amount}
Confidence: ${(signals.confidence * 100).toFixed(2)}%
Time: ${signals.timestamp}`;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down DeFi trading agent...');
  process.exit(0);
});

// Start the agent
main().catch(console.error); 