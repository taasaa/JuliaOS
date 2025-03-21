import { SwarmAgent } from '@juliaos/core';
import { DiscordConnector } from '@juliaos/platform-discord';
import { TelegramConnector } from '@juliaos/platform-telegram';
import { TwitterConnector } from '@juliaos/platform-twitter';
import { SlackConnector } from '@juliaos/platform-slack';
import { ArweaveStorage } from '@juliaos/core/storage';
import { EncryptionService } from '@juliaos/core/security';
import { DeFiProtocol } from '@juliaos/core/defi';
import { config } from 'dotenv';

config();

async function main() {
  // Initialize encryption service
  const encryption = new EncryptionService();
  const key = encryption.deriveKey(process.env.ENCRYPTION_KEY || 'default-key');

  // Initialize Arweave storage
  const storage = new ArweaveStorage({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    wallet: JSON.parse(process.env.ARWEAVE_WALLET || '{}')
  });

  // Initialize swarm
  const swarm = new SwarmAgent({
    id: 'multi-platform-swarm',
    name: 'Multi-Platform AI Swarm',
    maxAgents: 5,
    minAgents: 2,
    scalingRules: [{
      metric: 'totalTasks',
      threshold: 50,
      action: 'scale_up',
      amount: 1
    }]
  });

  // Create agents with different roles
  const messageAgent = await swarm.addAgent({
    id: 'message-handler',
    name: 'Message Handler',
    model: 'gpt-4',
    platforms: ['discord', 'telegram', 'twitter', 'slack'],
    actions: ['respond', 'store'],
    parameters: {}
  });

  const defiAgent = await swarm.addAgent({
    id: 'defi-handler',
    name: 'DeFi Handler',
    model: 'gpt-4',
    platforms: ['discord', 'telegram', 'twitter', 'slack'],
    actions: ['price', 'swap', 'liquidity'],
    parameters: {}
  });

  // Register message handling actions
  messageAgent.registerAction('respond', async (context) => {
    const { message } = context.parameters;
    
    // Encrypt sensitive data
    const encrypted = encryption.encryptObject({ message }, key);
    
    // Store in Arweave
    const txId = await storage.storeData(encrypted, [
      { name: 'Type', value: 'message' },
      { name: 'Agent', value: context.agent.id }
    ]);

    return `Processed and stored message. Transaction ID: ${txId}`;
  });

  messageAgent.registerAction('store', async (context) => {
    const { data, tags } = context.parameters;
    const encrypted = encryption.encryptObject(data, key);
    return await storage.storeData(encrypted, tags);
  });

  // Register DeFi actions
  const uniswapProtocol = new DeFiProtocol({
    name: 'Uniswap V3',
    chainId: 1,
    rpcUrl: process.env.MAINNET_RPC_URL || '',
    contractAddress: process.env.UNISWAP_ADDRESS || '',
    abi: [] // Add Uniswap ABI
  }, wallet);

  defiAgent.registerAction('price', async (context) => {
    const { token } = context.parameters;
    return await uniswapProtocol.getPrice(token);
  });

  defiAgent.registerAction('swap', async (context) => {
    const { tokenIn, tokenOut, amountIn, minAmountOut } = context.parameters;
    return await uniswapProtocol.swap({
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      deadline: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    });
  });

  defiAgent.registerAction('liquidity', async (context) => {
    const { token } = context.parameters;
    return await uniswapProtocol.getLiquidityData(token);
  });

  // Initialize platform connectors
  const discord = new DiscordConnector({
    token: process.env.DISCORD_TOKEN || '',
    commandPrefix: '!',
    intents: ['Guilds', 'GuildMessages', 'MessageContent']
  });

  const telegram = new TelegramConnector({
    token: process.env.TELEGRAM_TOKEN || '',
    commandPrefix: '/'
  });

  const twitter = new TwitterConnector({
    appKey: process.env.TWITTER_APP_KEY || '',
    appSecret: process.env.TWITTER_APP_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    commandPrefix: '!',
    mentionsOnly: true
  });

  const slack = new SlackConnector({
    token: process.env.SLACK_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    commandPrefix: '!'
  });

  // Connect platforms
  await Promise.all([
    discord.connect(),
    telegram.connect(),
    twitter.connect(),
    slack.connect()
  ]);

  // Handle platform events
  const platforms = [discord, telegram, twitter, slack];
  platforms.forEach(platform => {
    // Handle regular messages
    platform.on('message', async (data) => {
      const result = await messageAgent.executeAction('respond', {
        message: data.content,
        platform: platform.constructor.name
      });
      await platform.sendMessage(result, data.channelId);
    });

    // Handle DeFi commands
    platform.on('command', async (data) => {
      const [command, ...args] = data.content.split(' ');

      switch (command) {
        case 'price':
          const price = await defiAgent.executeAction('price', {
            token: args[0]
          });
          await platform.sendMessage(`Price: ${price}`, data.channelId);
          break;

        case 'swap':
          const [tokenIn, tokenOut, amountIn, minAmountOut] = args;
          const swapTx = await defiAgent.executeAction('swap', {
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut
          });
          await platform.sendMessage(`Swap transaction: ${swapTx}`, data.channelId);
          break;

        case 'liquidity':
          const liquidity = await defiAgent.executeAction('liquidity', {
            token: args[0]
          });
          await platform.sendMessage(
            `Liquidity data:\n${JSON.stringify(liquidity, null, 2)}`,
            data.channelId
          );
          break;
      }
    });
  });

  console.log('Multi-platform agent system is running!');
}

main().catch(console.error); 