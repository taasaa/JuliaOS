import { Telegraf, Context } from 'telegraf';
import { Update, Message } from 'telegraf/types';
import { EventEmitter } from 'events';

interface TelegramConfig {
  token: string;
  commandPrefix: string;
}

export class TelegramConnector extends EventEmitter {
  private bot: Telegraf;
  private config: TelegramConfig;
  private _isConnected: boolean = false;

  constructor(config: TelegramConfig) {
    super();
    this.config = config;
    console.log('Initializing Telegram bot with token:', config.token.slice(0, 10) + '...');
    this.bot = new Telegraf(config.token);
    
    // Set up error handling
    this.bot.catch((err: any) => {
      console.error('Telegram Error:', err);
      if (err.response) {
        console.error('Error response:', {
          code: err.response.error_code,
          description: err.response.description
        });
      }
      this.emit('error', err);
    });
  }

  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    try {
      console.log('Setting up Telegram message handlers...');
      
      // Set up message handlers
      this.bot.on('text', async (ctx) => {
        const msg = ctx.message;
        console.log('Received Telegram message:', {
          text: msg.text,
          from: msg.from?.username,
          chatId: msg.chat.id
        });
        
        // Handle commands
        if (msg.text.startsWith(this.config.commandPrefix)) {
          const command = msg.text.slice(this.config.commandPrefix.length);
          this.emit('command', {
            command,
            content: msg.text,
            chatId: msg.chat.id.toString(),
            sender: msg.from?.username || 'unknown',
            ctx: ctx // Pass the context to allow direct replies
          });
          return;
        }

        // Handle regular messages
        this.emit('message', {
          content: msg.text,
          chatId: msg.chat.id.toString(),
          sender: msg.from?.username || 'unknown',
          ctx: ctx // Pass the context to allow direct replies
        });

        // Immediately reply using context
        try {
          await ctx.reply(`Echo: ${msg.text}`);
          console.log('Immediate reply sent successfully');
        } catch (error) {
          console.error('Error sending immediate reply:', error);
        }
      });

      // Test bot info
      console.log('Fetching bot information...');
      const botInfo = await this.bot.telegram.getMe();
      console.log('Bot info:', {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name
      });

      // Start the bot
      console.log('Starting Telegram bot...');
      await this.bot.launch();
      console.log('Connected to Telegram successfully');
      this._isConnected = true;

      // Enable graceful stop
      process.once('SIGINT', () => this.disconnect());
      process.once('SIGTERM', () => this.disconnect());
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this._isConnected) {
      return;
    }

    try {
      console.log('Stopping Telegram bot...');
      await this.bot.stop();
      this._isConnected = false;
      console.log('Disconnected from Telegram successfully');
    } catch (error) {
      console.error('Error disconnecting from Telegram:', error);
      throw error;
    }
  }

  async sendMessage(content: string, chatId: string): Promise<void> {
    if (!this._isConnected) {
      throw new Error('Bot is not connected');
    }

    try {
      console.log('Sending Telegram message:', {
        chatId,
        contentLength: content.length
      });
      await this.bot.telegram.sendMessage(chatId, content);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message
        });
      }
      throw error;
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
} 