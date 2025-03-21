import { EventEmitter } from 'events';

export interface SkillConfig {
  name: string;
  type: string;
  parameters?: Record<string, any>;
}

export abstract class Skill extends EventEmitter {
  protected parameters: any;
  protected name: string;
  protected type: string;
  protected isInitialized: boolean;
  protected isRunning: boolean;

  constructor(parameters: any, name: string = '', type: string = '') {
    super();
    this.parameters = parameters;
    this.name = name;
    this.type = type;
    this.isInitialized = false;
    this.isRunning = false;
  }

  abstract initialize(): Promise<void>;
  abstract execute(): Promise<void>;
  abstract stop(): Promise<void>;

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

  isReady(): boolean {
    return this.isInitialized;
  }

  protected setInitialized(initialized: boolean): void {
    this.isInitialized = initialized;
    if (initialized) {
      this.emit('initialized');
    }
  }

  protected setRunning(running: boolean): void {
    this.isRunning = running;
    if (running) {
      this.emit('started');
    } else {
      this.emit('stopped');
    }
  }
} 