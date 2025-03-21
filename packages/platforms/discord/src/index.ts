import { Client, GatewayIntentBits } from 'discord.js';

export class DiscordConnector {
  private client: Client;
  private token: string;
  private commandPrefix: string;

  constructor(config: {
    token: string;
    commandPrefix?: string;
    intents?: GatewayIntentBits[];
  }) {
    this.token = config.token;
    this.commandPrefix = config.commandPrefix || '!';
    this.client = new Client({
      intents: config.intents || [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
  }

  async connect(): Promise<void> {
    await this.client.login(this.token);
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
  }
} 