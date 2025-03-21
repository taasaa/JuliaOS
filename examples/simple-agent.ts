import { DiscordConnector } from '../packages/platforms/discord/src';
import { TelegramConnector } from '../packages/platforms/telegram/src';
import { GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Initialize Discord bot
    console.log('Initializing Discord bot...');
    const discord = new DiscordConnector({
      token: process.env.DISCORD_TOKEN!,
      commandPrefix: '!',
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    // Initialize Telegram bot
    console.log('Initializing Telegram bot...');
    const telegram = new TelegramConnector({
      token: process.env.TELEGRAM_TOKEN!,
      commandPrefix: '/'
    });

    // Connect Discord
    console.log('Connecting to Discord...');
    await discord.connect();
    
    // Connect Telegram
    console.log('Connecting to Telegram...');
    await telegram.connect();

    // Set up Discord message handler
    discord.on('message', async (data) => {
      console.log('Discord message received:', {
        content: data.content,
        sender: data.sender,
        channelId: data.channelId
      });
      
      try {
        await discord.sendMessage(`Echo: ${data.content}`, data.channelId);
      } catch (error) {
        console.error('Error sending Discord message:', error);
      }
    });

    // Set up Telegram message handler
    telegram.on('message', async (data) => {
      console.log('Telegram message received:', {
        content: data.content,
        sender: data.sender,
        chatId: data.chatId
      });
      
      try {
        console.log('Attempting to send Telegram response...');
        const response = `Echo: ${data.content}`;
        console.log('Response to send:', {
          text: response,
          chatId: data.chatId
        });
        await telegram.sendMessage(response, data.chatId);
        console.log('Telegram response sent successfully');
      } catch (error) {
        console.error('Error sending Telegram message:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
    });

    console.log('\nBots are running! Try sending a message in Discord or Telegram.');
    console.log('Press Ctrl+C to stop the bots.\n');

  } catch (error) {
    console.error('Failed to start bots:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down bots...');
  process.exit(0);
});

// Start the bots
main().catch(console.error); 