import { EventEmitter } from 'events';
import { Platform } from '../platform/Platform';
import { Skill } from '../skills/Skill';

export interface AgentConfig {
  name: string;
  type: string;
  platforms?: Platform[];
  skills?: Skill[];
  parameters?: Record<string, any>;
}

export class BaseAgent extends EventEmitter {
  private name: string;
  private type: string;
  private platforms: Platform[];
  private skills: Skill[];
  private parameters: Record<string, any>;
  private isRunning: boolean;

  constructor(config: AgentConfig) {
    super();
    this.name = config.name;
    this.type = config.type;
    this.platforms = config.platforms || [];
    this.skills = config.skills || [];
    this.parameters = config.parameters || {};
    this.isRunning = false;
  }

  async initialize(): Promise<void> {
    // Initialize all platforms
    for (const platform of this.platforms) {
      await platform.connect();
    }

    // Initialize all skills
    for (const skill of this.skills) {
      await skill.initialize();
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;
    this.emit('started');

    // Start all platforms
    for (const platform of this.platforms) {
      await platform.start();
    }

    // Start all skills
    for (const skill of this.skills) {
      await skill.start();
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Agent is not running');
    }

    this.isRunning = false;
    this.emit('stopped');

    // Stop all platforms
    for (const platform of this.platforms) {
      await platform.stop();
    }

    // Stop all skills
    for (const skill of this.skills) {
      await skill.stop();
    }
  }

  addPlatform(platform: Platform): void {
    this.platforms.push(platform);
  }

  addSkill(skill: Skill): void {
    this.skills.push(skill);
  }

  getPlatforms(): Platform[] {
    return this.platforms;
  }

  getSkills(): Skill[] {
    return this.skills;
  }

  getName(): string {
    return this.name;
  }

  getType(): string {
    return this.type;
  }

  getParameters(): Record<string, any> {
    return this.parameters;
  }

  isActive(): boolean {
    return this.isRunning;
  }
} 