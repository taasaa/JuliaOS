import { EventEmitter } from 'events';
import { TwitterApi, TweetV2, TwitterApiTokens } from 'twitter-api-v2';

export interface TwitterConfig extends TwitterApiTokens {
  commandPrefix: string;
  autoReply?: boolean;
  mentionsOnly?: boolean;
}

export class TwitterConnector extends EventEmitter {
  private client: TwitterApi;
  private config: TwitterConfig;
  private userId?: string;
  private streamRules: Map<string, string> = new Map();

  constructor(config: TwitterConfig) {
    super();
    this.config = config;
    this.client = new TwitterApi(config);
  }

  async connect(): Promise<void> {
    try {
      // Verify credentials and get user ID
      const me = await this.client.v2.me();
      this.userId = me.data.id;

      // Set up stream rules
      await this.setupStreamRules();

      // Start streaming
      await this.startStreaming();

      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Clean up stream rules
    await this.cleanupStreamRules();
    this.emit('disconnected');
  }

  private async setupStreamRules() {
    // Clean up existing rules
    await this.cleanupStreamRules();

    // Add new rules
    const rules = [];

    // Rule for mentions
    if (this.config.mentionsOnly) {
      rules.push({ value: `@${this.userId}` });
    }

    // Rule for commands
    if (this.config.commandPrefix) {
      rules.push({ value: `${this.config.commandPrefix}` });
    }

    if (rules.length > 0) {
      const result = await this.client.v2.updateStreamRules({
        add: rules
      });

      // Store rule IDs
      result.data?.forEach(rule => {
        this.streamRules.set(rule.id, rule.value);
      });
    }
  }

  private async cleanupStreamRules() {
    const rules = await this.client.v2.streamRules();
    if (rules.data?.length) {
      await this.client.v2.updateStreamRules({
        delete: { ids: rules.data.map(rule => rule.id) }
      });
    }
    this.streamRules.clear();
  }

  private async startStreaming() {
    const stream = await this.client.v2.searchStream({
      'tweet.fields': ['referenced_tweets', 'author_id', 'created_at'],
      'user.fields': ['username'],
      expansions: ['author_id', 'referenced_tweets.id']
    });

    stream.on('data', async (tweet: TweetV2) => {
      // Ignore our own tweets
      if (tweet.author_id === this.userId) return;

      // Process the tweet
      await this.processTweet(tweet);
    });

    stream.on('error', error => {
      this.emit('error', error);
    });
  }

  private async processTweet(tweet: TweetV2) {
    const content = tweet.text;
    
    // Check if it's a command
    if (this.config.commandPrefix && content.startsWith(this.config.commandPrefix)) {
      const command = content.slice(this.config.commandPrefix.length).trim();
      this.emit('command', {
        content: command,
        authorId: tweet.author_id,
        messageId: tweet.id,
        raw: tweet
      });
    }

    // Emit message event
    this.emit('message', {
      content,
      authorId: tweet.author_id,
      messageId: tweet.id,
      raw: tweet
    });
  }

  async sendMessage(content: string, replyToId?: string): Promise<void> {
    try {
      const tweetData: any = { text: content };
      if (replyToId) {
        tweetData.reply = { in_reply_to_tweet_id: replyToId };
      }

      await this.client.v2.tweet(tweetData);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async sendDirectMessage(content: string, userId: string): Promise<void> {
    try {
      await this.client.v2.sendDmToParticipant(userId, {
        text: content
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.v2.deleteTweet(messageId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
} 