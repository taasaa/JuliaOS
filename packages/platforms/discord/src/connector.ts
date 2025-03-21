import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';

interface DiscordConfig {
  token: string;
  commandPrefix: string;
  intents: GatewayIntentBits[];
}

export class DiscordConnector extends EventEmitter {
  private client: Client;
  private config: DiscordConfig;
  private _isConnected: boolean = false;

  constructor(config: DiscordConfig) {
    super();
    this.config = config;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        ...config.intents
      ]
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('messageCreate', (message: Message) => {
      if (message.author.bot) return;

      if (message.content.startsWith(this.config.commandPrefix)) {
        const command = message.content.slice(this.config.commandPrefix.length);
        this.emit('command', {
          command,
          content: message.content,
          channelId: message.channelId,
          sender: message.author.username,
          raw: message
        });
      } else {
        this.emit('message', {
          content: message.content,
          channelId: message.channelId,
          sender: message.author.username,
          raw: message
        });
      }
    });

    this.client.on('error', (error: Error) => {
      console.error('Discord Error:', error);
      this.emit('error', error);
    });
  }

  async connect(): Promise<void> {
    if (this._isConnected) return;

    try {
      await this.client.login(this.config.token);
      this._isConnected = true;
      console.log('Connected to Discord');
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this._isConnected) return;

    this.client.destroy();
    this._isConnected = false;
  }

  async sendMessage(content: string, channelId: string): Promise<void> {
    if (!this._isConnected) {
      throw new Error('Not connected to Discord');
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel instanceof TextChannel) {
        await channel.send(content);
      } else {
        throw new Error('Invalid channel type');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
} 