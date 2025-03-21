export abstract class BaseAgent {
  protected name: string;
  protected type: string;
  protected platforms: any[];
  protected skills: any[];

  constructor(config: {
    name: string;
    type: string;
    platforms: any[];
    skills: any[];
  }) {
    this.name = config.name;
    this.type = config.type;
    this.platforms = config.platforms;
    this.skills = config.skills;
  }

  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
} 