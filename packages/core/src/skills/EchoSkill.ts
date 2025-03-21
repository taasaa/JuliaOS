import { Skill, SkillConfig } from './Skill';

export interface EchoSkillConfig extends SkillConfig {
  prefix?: string;
}

export class EchoSkill extends Skill {
  private prefix: string;

  constructor(config: EchoSkillConfig) {
    super(config);
    this.prefix = config.prefix || 'Echo: ';
  }

  async initialize(): Promise<void> {
    // No initialization needed for echo skill
    this.setInitialized(true);
  }

  async start(): Promise<void> {
    this.setRunning(true);
  }

  async stop(): Promise<void> {
    this.setRunning(false);
  }

  async execute(input: string): Promise<string> {
    if (!this.isActive()) {
      throw new Error('Echo skill is not running');
    }
    return `${this.prefix}${input}`;
  }
} 