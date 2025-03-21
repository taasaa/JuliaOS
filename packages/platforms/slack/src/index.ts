import { EventEmitter } from 'events';
import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

export interface SlackConfig {
  token: string;
  signingSecret: string;
  appToken: string;
  commandPrefix: string;
  port?: number;
}

export class SlackConnector extends EventEmitter {
  private app: App;
  private client: WebClient;
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    super();
    this.config = config;
    
    this.app = new App({
      token: config.token,
      signingSecret: config.signingSecret,
      socketMode: true,
      appToken: config.appToken,
      port: config.port || 3000,
      logLevel: LogLevel.DEBUG
    });

    this.client = new WebClient(config.token);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle messages
    this.app.message(async ({ message, say }) => {
      if (message.subtype === 'bot_message') return;

      const content = message.text || '';
      
      // Check if it's a command
      if (content.startsWith(this.config.commandPrefix)) {
        const command = content.slice(this.config.commandPrefix.length).trim();
        this.emit('command', {
          content: command,
          authorId: message.user,
          channelId: message.channel,
          messageId: message.ts,
          raw: message
        });
      }

      // Emit message event
      this.emit('message', {
        content,
        authorId: message.user,
        channelId: message.channel,
        messageId: message.ts,
        raw: message
      });
    });

    // Handle app mentions
    this.app.event('app_mention', async ({ event }) => {
      this.emit('mention', {
        content: event.text,
        authorId: event.user,
        channelId: event.channel,
        messageId: event.ts,
        raw: event
      });
    });

    // Handle reactions
    this.app.event('reaction_added', async ({ event }) => {
      this.emit('reactionAdded', {
        reaction: event.reaction,
        authorId: event.user,
        messageId: event.item.ts,
        channelId: event.item.channel,
        raw: event
      });
    });
  }

  async connect(): Promise<void> {
    try {
      await this.app.start();
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.app.stop();
    this.emit('disconnected');
  }

  async sendMessage(content: string, channelId: string, threadTs?: string): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel: channelId,
        text: content,
        thread_ts: threadTs
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async updateMessage(content: string, channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.chat.update({
        channel: channelId,
        ts: messageId,
        text: content
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.chat.delete({
        channel: channelId,
        ts: messageId
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async addReaction(reaction: string, channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.reactions.add({
        channel: channelId,
        timestamp: messageId,
        name: reaction
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async removeReaction(reaction: string, channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.reactions.remove({
        channel: channelId,
        timestamp: messageId,
        name: reaction
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
} 