#!/usr/bin/env node

// This is a simple entry point that loads the compiled TypeScript implementation
require('../dist/index');

console.log('JuliaOS CLI is starting...');
console.log('JuliaOS CLI Version: 0.1.0');

const command = process.argv[2];

if (!command) {
  console.log('Usage: j3os <command>');
  console.log('Commands:');
  console.log('  init    - Create a new JuliaOS project');
  console.log('  create  - Create a new component');
  console.log('  version - Show version information');
  console.log('  help    - Show help information');
  process.exit(0);
}

if (command === 'version') {
  console.log('JuliaOS CLI Version: 0.1.0');
} else if (command === 'init') {
  console.log('Creating a new JuliaOS project');
  console.log('This feature is coming soon!');
} else if (command === 'create') {
  console.log('Creating a new component');
  console.log('This feature is coming soon!');
} else if (command === 'help') {
  console.log('Usage: j3os <command>');
  console.log('Commands:');
  console.log('  init    - Create a new JuliaOS project');
  console.log('  create  - Create a new component');
  console.log('  version - Show version information');
  console.log('  help    - Show help information');
} else {
  console.log(`Unknown command: ${command}`);
  console.log('Run "j3os help" for usage information');
} 