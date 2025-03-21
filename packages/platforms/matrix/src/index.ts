import { EventEmitter } from 'events';
import * as sdk from 'matrix-js-sdk';
import { MatrixClient, MatrixEvent, Room, RoomMember, RoomEvent, RoomMemberEvent, IRoomTimelineData } from 'matrix-js-sdk';

export interface MatrixConfig {
  homeserverUrl: string;
  accessToken: string;
  userId: string;
  commandPrefix: string;
  autoJoin?: boolean;
}

export interface MatrixMessage {
  content: string;
  authorId: string;
  roomId: string;
  messageId: string;
  raw: MatrixEvent;
}

export interface MatrixReaction {
  eventId: string;
  key: string;
  userId: string;
}

export class MatrixConnector extends EventEmitter {
  private client: MatrixClient;
  private config: MatrixConfig;

  constructor(config: MatrixConfig) {
    super();
    this.config = config;
    this.client = sdk.createClient({
      baseUrl: config.homeserverUrl,
      accessToken: config.accessToken,
      userId: config.userId
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.startClient();
      this.setupEventHandlers();
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.stopClient();
      this.emit('disconnected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined, toStartOfTimeline: boolean | undefined, removed: boolean, data: IRoomTimelineData) => {
      if (!room || event.getType() !== 'm.room.message') return;
      if (event.getSender() === this.config.userId) return;

      const content = event.getContent();
      const message: MatrixMessage = {
        content: content.body,
        authorId: event.getSender()!,
        roomId: room.roomId,
        messageId: event.getId()!,
        raw: event
      };

      if (content.body.startsWith(this.config.commandPrefix)) {
        this.emit('command', {
          ...message,
          content: content.body.slice(this.config.commandPrefix.length)
        });
      } else {
        this.emit('message', message);
      }
    });

    if (this.config.autoJoin) {
      this.client.on(RoomMemberEvent.Membership, (event: MatrixEvent, member: RoomMember) => {
        if (member.membership === 'invite' && member.userId === this.config.userId) {
          this.joinRoom(member.roomId);
        }
      });
    }

    // Add reaction handler
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined, toStartOfTimeline: boolean | undefined, removed: boolean, data: any) => {
      if (!room || event.getType() !== 'm.reaction') return;

      const content = event.getContent();
      const relation = content['m.relates_to'];
      
      if (relation && relation.rel_type === 'm.annotation') {
        const reaction: MatrixReaction = {
          eventId: relation.event_id,
          key: relation.key,
          userId: event.getSender()!
        };

        this.emit('reaction', reaction);
      }
    });
  }

  async sendMessage(content: string, roomId: string): Promise<void> {
    try {
      await this.client.sendMessage(roomId, {
        msgtype: 'm.text',
        body: content
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async editMessage(roomId: string, messageId: string, newContent: string): Promise<void> {
    try {
      await this.client.sendEvent(roomId, 'm.room.message', {
        msgtype: 'm.text',
        body: `* ${newContent}`,
        'm.new_content': {
          msgtype: 'm.text',
          body: newContent
        },
        'm.relates_to': {
          rel_type: 'm.replace',
          event_id: messageId
        }
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async deleteMessage(roomId: string, messageId: string): Promise<void> {
    try {
      await this.client.redactEvent(roomId, messageId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    try {
      await this.client.joinRoom(roomId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async leaveRoom(roomId: string): Promise<void> {
    try {
      await this.client.leave(roomId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async addReaction(roomId: string, eventId: string, key: string): Promise<void> {
    try {
      await this.client.sendEvent(roomId, 'm.reaction', {
        'm.relates_to': {
          rel_type: 'm.annotation',
          event_id: eventId,
          key: key
        }
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async removeReaction(roomId: string, eventId: string, key: string): Promise<void> {
    try {
      // Find the reaction event ID first
      const reactions = await this.client.getRelations(
        roomId,
        eventId,
        'm.annotation',
        'm.reaction'
      );
      
      const reactionEvent = reactions.events.find(
        event => 
          event.getContent()['m.relates_to'].key === key &&
          event.getSender() === this.config.userId
      );

      if (reactionEvent) {
        await this.client.redactEvent(roomId, reactionEvent.getId()!);
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
} 