param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1, ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Set error action preference
$ErrorActionPreference = "Stop"

function Show-Version {
    Write-Host "JuliaOS CLI v0.1.0"
}

function Show-Help {
    Show-Version
    Write-Host ""
    Write-Host "Usage: j3os <command>"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  init [project-name]  - Create a new JuliaOS project"
    Write-Host "  create               - Create a new component"
    Write-Host "  version              - Show version information"
    Write-Host "  help                 - Show this help information"
}

function Initialize-Project {
    param(
        [string]$ProjectName = "juliaos-project"
    )
    
    Show-Version
    Write-Host "Creating a new JuliaOS project: $ProjectName" -ForegroundColor Cyan
    
    # Create project directory
    if (!(Test-Path $ProjectName)) {
        New-Item -ItemType Directory -Path $ProjectName | Out-Null
    } else {
        Write-Host "Directory already exists. Using existing directory." -ForegroundColor Yellow
    }
    
    # Create subdirectories
    New-Item -ItemType Directory -Path "$ProjectName\src" -Force | Out-Null
    New-Item -ItemType Directory -Path "$ProjectName\src\agents" -Force | Out-Null
    New-Item -ItemType Directory -Path "$ProjectName\src\skills" -Force | Out-Null
    New-Item -ItemType Directory -Path "$ProjectName\test" -Force | Out-Null
    
    # Create package.json
    $packageJson = @"
{
  "name": "$ProjectName",
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
"@
    Set-Content -Path "$ProjectName\package.json" -Value $packageJson
    
    # Create tsconfig.json
    $tsconfig = @"
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
"@
    Set-Content -Path "$ProjectName\tsconfig.json" -Value $tsconfig
    
    # Create README.md
    $readme = @"
# $ProjectName

A JuliaOS Framework project

## Getting Started

```bash
npm install
npm run build
npm start
```
"@
    Set-Content -Path "$ProjectName\README.md" -Value $readme
    
    # Create .gitignore
    $gitignore = @"
node_modules/
dist/
.env
.DS_Store
"@
    Set-Content -Path "$ProjectName\.gitignore" -Value $gitignore
    
    # Create sample agent
    $sampleAgent = @"
import { EventEmitter } from 'events';

export class SampleAgent extends EventEmitter {
  private name: string;
  private isRunning: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async start(): Promise<void> {
    console.log(`Agent \${this.name} starting...`);
    this.isRunning = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log(`Agent \${this.name} stopping...`);
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
"@
    Set-Content -Path "$ProjectName\src\agents\SampleAgent.ts" -Value $sampleAgent
    
    # Create main index.ts
    $mainIndex = @"
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
  console.log(`Agent \${agent.getName()} is active: \${agent.isActive()}`);
  
  // Stop the agent
  setTimeout(async () => {
    await agent.stop();
    console.log('Process complete.');
  }, 2000);
}

main().catch(console.error);
"@
    Set-Content -Path "$ProjectName\src\index.ts" -Value $mainIndex
    
    Write-Host ""
    Write-Host "Project created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To get started, run:"
    Write-Host "  cd $ProjectName" -ForegroundColor Cyan
    Write-Host "  npm install" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor Cyan
    Write-Host "  npm start" -ForegroundColor Cyan
}

function Create-Component {
    Show-Version
    Write-Host "Creating a new component..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This feature is coming soon!" -ForegroundColor Yellow
}

# Execute the appropriate command
try {
    switch ($Command.ToLower()) {
        "init" { 
            $projectName = if ($Arguments -and $Arguments.Length -gt 0) { $Arguments[0] } else { "juliaos-project" }
            Initialize-Project -ProjectName $projectName 
        }
        "create" { Create-Component }
        "version" { Show-Version }
        "help" { Show-Help }
        default {
            Write-Host "Unknown command: $Command" -ForegroundColor Red
            Write-Host "Run 'j3os help' for usage information" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
} 