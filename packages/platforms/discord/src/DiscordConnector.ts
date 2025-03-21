import { Client, GatewayIntentBits } from 'discord.js';
import { Platform, PlatformConfig, MessageData } from '@juliaos/core';

export interface DiscordConfig extends PlatformConfig {
  parameters: {
    token: string;
    commandPrefix: string;
    intents: GatewayIntentBits[];
  };
}

export class DiscordConnector extends Platform {
  private client: Client;
  private commandPrefix: string;

  constructor(config: DiscordConfig) {
    super(config);
    this.client = new Client({ intents: config.parameters.intents });
    this.commandPrefix = config.parameters.commandPrefix;
  }

  async connect(): Promise<void> {
    try {
      await this.client.login(this.parameters.token);
      this.setConnected(true);
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.destroy();
      this.setConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Discord:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  async stop(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(message: string, channelId: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel?.isTextBased()) {
        await channel.send(message);
      } else {
        throw new Error('Channel is not text-based');
      }
    } catch (error) {
      console.error('Failed to send Discord message:', error);
      throw error;
    }
  }

  // Set up message event handler
  setupMessageHandler(): void {
    this.client.on('messageCreate', (message) => {
      if (message.author.bot) return;

      const messageData: MessageData = {
        content: message.content,
        sender: message.author.id,
        channelId: message.channelId,
        timestamp: message.createdAt
      };

      this.emit('message', messageData);
    });
  }
} 