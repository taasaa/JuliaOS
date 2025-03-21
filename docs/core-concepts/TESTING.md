# Testing in JuliaOS Framework

This guide covers testing practices and features in the JuliaOS Framework.

## Test Mode

The framework provides a comprehensive test mode that allows you to simulate various trading scenarios and error conditions.

### Configuration

```typescript
const config = {
  testMode: true,
  testError: false, // Set to true to simulate errors
  mockMarketData: {
    'SOL/USDC': {
      price: 100,
      volume: 1000000
    }
  }
};
```

### Features

1. **Mock WebSocket**
   - Simulates real-time market data
   - Allows testing of WebSocket events
   - Provides message history tracking
   - Supports error simulation

2. **Portfolio Simulation**
   - Simulates portfolio balances
   - Allows testing of trade execution
   - Validates balance calculations
   - Supports multiple currencies

3. **Error Simulation**
   - WebSocket connection failures
   - Trade validation errors
   - Portfolio balance errors
   - Market data errors

## Writing Tests

### Basic Test Structure

```typescript
import { JuliaSwarm } from '@juliaos/julia-swarm';

describe('JuliaSwarm', () => {
  let swarm: JuliaSwarm;

  beforeEach(() => {
    swarm = new JuliaSwarm({
      testMode: true,
      // ... other configuration
    });
  });

  afterEach(async () => {
    await swarm.stop();
  });

  test('should initialize successfully', async () => {
    await swarm.initialize();
    expect(swarm.isInitialized()).toBe(true);
  });

  test('should validate trades correctly', async () => {
    await swarm.initialize();
    const trade = {
      pair: 'SOL/USDC',
      type: 'buy',
      amount: 0.1
    };
    
    await expect(swarm.validateTrade(trade)).resolves.toBe(true);
  });
});
```

### Testing Error Conditions

```typescript
test('should handle WebSocket errors', async () => {
  const swarm = new JuliaSwarm({
    testMode: true,
    testError: true
  });

  await expect(swarm.initialize()).rejects.toThrow('WebSocket connection failed');
});

test('should validate portfolio balances', async () => {
  await swarm.initialize();
  
  // Test insufficient balance
  const trade = {
    pair: 'SOL/USDC',
    type: 'buy',
    amount: 1000 // More than available balance
  };

  await expect(swarm.validateTrade(trade)).rejects.toThrow('Insufficient balance');
});
```

### Testing Portfolio Updates

```typescript
test('should update portfolio correctly after trade', async () => {
  await swarm.initialize();
  
  const initialPortfolio = await swarm.getPortfolio();
  const trade = {
    pair: 'SOL/USDC',
    type: 'buy',
    amount: 0.1
  };

  const result = await swarm.executeTrade(trade);
  const updatedPortfolio = await swarm.getPortfolio();

  expect(result.success).toBe(true);
  expect(updatedPortfolio.balances['SOL']).toBe(initialPortfolio.balances['SOL'] + 0.1);
  expect(updatedPortfolio.balances['USDC']).toBe(initialPortfolio.balances['USDC'] - 10);
});
```

## Best Practices

1. **Isolation**
   - Each test should be independent
   - Clean up resources after each test
   - Use fresh instances for each test

2. **Error Testing**
   - Test both success and failure cases
   - Verify error messages and types
   - Test edge cases and boundary conditions

3. **State Management**
   - Verify state changes after operations
   - Test atomic operations
   - Validate data consistency

4. **Performance**
   - Keep tests focused and fast
   - Avoid unnecessary setup
   - Use appropriate timeouts

## Common Issues and Solutions

1. **WebSocket Connection Issues**
   ```typescript
   // Solution: Increase timeout and add retry logic
   const swarm = new JuliaSwarm({
     testMode: true,
     wsConfig: {
       timeout: 10000,
       retries: 3
     }
   });
   ```

2. **Portfolio Balance Inconsistencies**
   ```typescript
   // Solution: Use precise decimal handling
   const result = await swarm.executeTrade({
     pair: 'SOL/USDC',
     type: 'buy',
     amount: 0.1,
     price: 100
   });
   ```

3. **Test Mode Configuration**
   ```typescript
   // Solution: Use environment variables
   process.env.NODE_ENV = 'test';
   process.env.TEST_ERROR = 'true';
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/JuliaSwarm.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Continuous Integration

The framework includes GitHub Actions workflows for automated testing:

1. **Unit Tests**
   - Runs on every push and pull request
   - Tests all components in isolation
   - Generates coverage reports

2. **Integration Tests**
   - Runs on pull requests
   - Tests component interactions
   - Validates system behavior

3. **Performance Tests**
   - Runs on release tags
   - Measures system performance
   - Validates scalability 