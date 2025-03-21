import { BaseAgent } from '../packages/core/src/agent/BaseAgent';
import { DiscordConnector } from '../packages/platforms/discord/src';
import { TelegramConnector } from '../packages/platforms/telegram/src';
import { EchoSkill } from '../packages/core/src/skills/EchoSkill';
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Create platforms
    const discord = new DiscordConnector({
      name: 'discord-bot',
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

    const telegram = new TelegramConnector({
      name: 'telegram-bot',
      type: 'telegram',
      parameters: {
        token: process.env.TELEGRAM_TOKEN!,
        commandPrefix: '/'
      }
    });

    // Create skills
    const echoSkill = new EchoSkill({
      name: 'echo',
      type: 'message',
      parameters: {
        prefix: 'Advanced Echo: '
      }
    });

    // Create agent
    const agent = new BaseAgent({
      name: 'advanced-agent',
      type: 'messaging',
      platforms: [discord, telegram],
      skills: [echoSkill]
    });

    // Initialize agent
    console.log('Initializing agent...');
    await agent.initialize();

    // Set up message handlers
    discord.on('message', async (data) => {
      try {
        const response = await echoSkill.execute(data.content);
        await discord.sendMessage(response, data.channelId);
      } catch (error) {
        console.error('Error handling Discord message:', error);
      }
    });

    telegram.on('message', async (data) => {
      try {
        const response = await echoSkill.execute(data.content);
        await telegram.sendMessage(response, data.chatId);
      } catch (error) {
        console.error('Error handling Telegram message:', error);
      }
    });

    // Start agent
    console.log('Starting agent...');
    await agent.start();

    console.log('\nAgent is running! Try sending a message in Discord or Telegram.');
    console.log('Press Ctrl+C to stop the agent.\n');

  } catch (error) {
    console.error('Failed to start agent:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down agent...');
  process.exit(0);
});

// Start the agent
main().catch(console.error); 