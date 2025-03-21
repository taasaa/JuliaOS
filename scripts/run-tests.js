#!/usr/bin/env node

/**
 * This script runs tests using the new directory structure.
 * It allows running all tests or specific test types.
 * 
 * Usage: 
 *   node scripts/run-tests.js all
 *   node scripts/run-tests.js unit
 *   node scripts/run-tests.js integration
 *   node scripts/run-tests.js contracts
 *   node scripts/run-tests.js e2e
 */

const { execSync } = require('child_process');

// Get test type from command-line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

// Validate test type
const validTestTypes = ['all', 'unit', 'integration', 'contracts', 'e2e'];
if (!validTestTypes.includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid test types: ${validTestTypes.join(', ')}`);
  process.exit(1);
}

// Run the appropriate tests
try {
  console.log(`Running ${testType === 'all' ? 'all' : testType} tests...`);
  
  let command;
  switch (testType) {
    case 'all':
      command = 'npm test';
      break;
    case 'unit':
      command = 'npm run test:unit';
      break;
    case 'integration':
      command = 'npm run test:integration';
      break;
    case 'contracts':
      command = 'npm run test:contracts';
      break;
    case 'e2e':
      command = 'npm run test:e2e';
      break;
  }
  
  // Execute the command
  execSync(command, { stdio: 'inherit' });
  
  console.log(`${testType === 'all' ? 'All' : testType} tests completed successfully!`);
} catch (error) {
  console.error(`${testType === 'all' ? 'All' : testType} tests failed with error:`, error.message);
  process.exit(1);
} 