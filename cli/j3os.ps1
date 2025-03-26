# J3OS CLI PowerShell Implementation
# This script provides a command-line interface for managing J3OS projects

# Version
$VERSION = "0.1.0"

# Show version
function Show-Version {
    Write-Host "J3OS CLI v$VERSION"
}

# Show help
function Show-Help {
    Write-Host "Usage: j3os <command>"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  init [project-name]  - Create a new J3OS project"
    Write-Host "  create -t <type> -n <name>  - Create a new component"
    Write-Host "  version  - Show version information"
    Write-Host "  help  - Show this help message"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -h, --help  - Show help information"
    Write-Host "  -v, --version  - Show version information"
}

# Initialize a new project
function Initialize-Project {
    param(
        [string]$ProjectName = "j3os-project"
    )
    
    Write-Host "Creating a new J3OS project: $ProjectName" -ForegroundColor Cyan
    
    # Create project directory
    New-Item -ItemType Directory -Path $ProjectName -Force | Out-Null
    Set-Location $ProjectName
    
    # Initialize npm project
    npm init -y | Out-Null
    
    # Update package.json
    @"
{
  "name": "$ProjectName",
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
"@ | Set-Content -Path "package.json"
    
    # Create project structure
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
    New-Item -ItemType Directory -Path "tests" -Force | Out-Null
    
    # Create README.md
    @"
# $ProjectName

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
"@ | Set-Content -Path "README.md"
    
    # Create .gitignore
    @"
node_modules/
dist/
.env
*.log
"@ | Set-Content -Path ".gitignore"
    
    # Create tsconfig.json
    @"
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
"@ | Set-Content -Path "tsconfig.json"
    
    # Create initial source file
    @"
// J3OS Framework entry point
console.log('Welcome to J3OS Framework!');
"@ | Set-Content -Path "src/index.ts"
    
    # Install dependencies
    npm install | Out-Null
    
    Write-Host "Project created successfully!" -ForegroundColor Green
    Write-Host "Run 'j3os help' for usage information" -ForegroundColor Yellow
}

# Main command handling
$Command = $args[0]

switch ($Command) {
    "init" {
        $projectName = if ($args.Length -gt 1) { $args[1] } else { "j3os-project" }
        Initialize-Project -ProjectName $projectName
    }
    "version" { Show-Version }
    "help" { Show-Help }
    "-v" { Show-Version }
    "--version" { Show-Version }
    "-h" { Show-Help }
    "--help" { Show-Help }
    "" { Show-Help }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
} 