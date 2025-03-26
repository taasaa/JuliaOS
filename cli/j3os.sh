#!/bin/bash
# Main CLI implementation for J3OS Framework
# This script provides a command-line interface for managing J3OS projects

# Set error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Version
VERSION="0.1.0"

# Command line arguments
COMMAND=$1
COMMAND=${COMMAND:-help}
shift 1 2>/dev/null || true

# Show version
show_version() {
    echo "J3OS CLI v${VERSION}"
}

# Show help
show_help() {
    echo "Usage: j3os <command>"
    echo ""
    echo "Commands:"
    echo "  init [project-name]  - Create a new J3OS project"
    echo "  create -t <type> -n <name>  - Create a new component"
    echo "  version  - Show version information"
    echo "  help  - Show this help message"
    echo ""
    echo "Options:"
    echo "  -h, --help  - Show help information"
    echo "  -v, --version  - Show version information"
}

# Initialize a new project
init_project() {
    local PROJECT_NAME=${1:-j3os-project}
    
    echo -e "${CYAN}Creating a new J3OS project: ${PROJECT_NAME}${NC}"
    
    # Create project directory
    mkdir -p "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    
    # Initialize npm project
    npm init -y
    
    # Update package.json
    cat > package.json << EOF
{
  "name": "${PROJECT_NAME}",
  "version": "0.1.0",
  "description": "A J3OS Framework project",
  "main": "src/index.ts",
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@j3os/core": "^0.1.0"
  },
  "devDependencies": {
    "@types/node": "^16.0.0",
    "typescript": "^4.0.0",
    "ts-node": "^10.0.0",
    "jest": "^27.0.0",
    "@types/jest": "^27.0.0",
    "ts-jest": "^27.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0"
  }
}
EOF
    
    # Create project structure
    mkdir -p src
    mkdir -p tests
    
    # Create README.md
    cat > README.md << EOF
# ${PROJECT_NAME}

A J3OS Framework project

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the project:
   \`\`\`bash
   npm start
   \`\`\`

3. Run tests:
   \`\`\`bash
   npm test
   \`\`\`
EOF
    
    # Create .gitignore
    cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
EOF
    
    # Create tsconfig.json
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
    
    # Create initial source file
    cat > src/index.ts << EOF
// J3OS Framework entry point
console.log('Welcome to J3OS Framework!');
EOF
    
    # Install dependencies
    npm install
    
    echo -e "${GREEN}Project created successfully!${NC}"
    echo -e "${YELLOW}Run 'j3os help' for usage information${NC}"
}

# Create component function
create() {
    version
    echo -e "${CYAN}Creating a new component...${NC}"
    echo ""
    echo -e "${YELLOW}This feature is coming soon!${NC}"
}

# Main command handling
case "$COMMAND" in
    "init")
        init_project "$2"
        ;;
    "create")
        create "$@"
        ;;
    "version"|"-v"|"--version")
        show_version
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac 