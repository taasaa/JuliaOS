# Tests Directory

This directory contains all test files for the JuliaOS Framework.

## Structure

- `unit/` - Unit tests for individual components
- `integration/` - Integration tests across multiple components
- `contracts/` - Tests for smart contracts
- `e2e/` - End-to-end tests
- `fixtures/` - Test data and fixtures used across tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:contracts
npm run test:e2e
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory. 