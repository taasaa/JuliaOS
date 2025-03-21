#!/bin/bash
# Main CLI implementation for JuliaOS Framework

# Set error handling
set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Command line arguments
COMMAND=$1
COMMAND=${COMMAND:-help}
shift 1 2>/dev/null || true

# Version function
version() {
    echo "JuliaOS CLI v0.1.0"
}

# Help function
help() {
    version
    echo ""
    echo "Usage: j3os <command>"
    echo ""
    echo "Commands:"
    echo "  init [project-name]  - Create a new JuliaOS project"
    echo "  create               - Create a new component"
    echo "  version              - Show version information"
    echo "  help                 - Show this help information"
}

# Initialize project function
init() {
    PROJECT_NAME=${1:-juliaos-project}
    
    version
    echo -e "${CYAN}Creating a new JuliaOS project: ${PROJECT_NAME}${NC}"
    
    # Create project directory
    if [ ! -d "$PROJECT_NAME" ]; then
        mkdir -p "$PROJECT_NAME"
    else
        echo -e "${YELLOW}Directory already exists. Using existing directory.${NC}"
    fi
    
    # Create subdirectories
    mkdir -p "$PROJECT_NAME/src/agents"
    mkdir -p "$PROJECT_NAME/src/skills"
    mkdir -p "$PROJECT_NAME/test"
    
    # Create package.json
    cat > "$PROJECT_NAME/package.json" << EOL
{
  "name": "$PROJECT_NAME",
  "version": "0.1.0",
  "description": "A JuliaOS Framework project",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@juliaos/core": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0"
  }
}
EOL
    
    # Create tsconfig.json
    cat > "$PROJECT_NAME/tsconfig.json" << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOL
    
    # Create README.md
    cat > "$PROJECT_NAME/README.md" << EOL
# $PROJECT_NAME

A JuliaOS Framework project

## Getting Started

\`\`\`bash
npm install
npm run build
npm start
\`\`\`
EOL
    
    # Create .gitignore
    cat > "$PROJECT_NAME/.gitignore" << EOL
node_modules/
dist/
.env
.DS_Store
EOL
    
    # Create sample agent
    cat > "$PROJECT_NAME/src/agents/SampleAgent.ts" << EOL
import { EventEmitter } from 'events';

export class SampleAgent extends EventEmitter {
  private name: string;
  private isRunning: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async start(): Promise<void> {
    console.log(\`Agent \${this.name} starting...\`);
    this.isRunning = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log(\`Agent \${this.name} stopping...\`);
    this.isRunning = false;
    this.emit('stopped');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getName(): string {
    return this.name;
  }
}
EOL
    
    # Create main index.ts
    cat > "$PROJECT_NAME/src/index.ts" << EOL
import { SampleAgent } from './agents/SampleAgent';

async function main() {
  // Create a sample agent
  const agent = new SampleAgent('MyFirstAgent');
  
  // Register event listeners
  agent.on('started', () => {
    console.log('Agent started successfully!');
  });
  
  agent.on('stopped', () => {
    console.log('Agent stopped successfully!');
  });
  
  // Start the agent
  await agent.start();
  
  // Do some work
  console.log(\`Agent \${agent.getName()} is active: \${agent.isActive()}\`);
  
  // Stop the agent
  setTimeout(async () => {
    await agent.stop();
    console.log('Process complete.');
  }, 2000);
}

main().catch(console.error);
EOL
    
    echo ""
    echo -e "${GREEN}Project created successfully!${NC}"
    echo ""
    echo "To get started, run:"
    echo -e "  cd $PROJECT_NAME"
    echo -e "  npm install"
    echo -e "  npm run build"
    echo -e "  npm start"
}

# Create component function
create() {
    version
    echo -e "${CYAN}Creating a new component...${NC}"
    echo ""
    echo -e "${YELLOW}This feature is coming soon!${NC}"
}

# Main command execution
case $COMMAND in
    "init")
        init "$@"
        ;;
    "create")
        create "$@"
        ;;
    "version")
        version
        ;;
    "help")
        help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo -e "${YELLOW}Run 'j3os help' for usage information${NC}"
        exit 1
        ;;
esac 