# JuliaOS Framework API Reference

This document provides detailed information about the APIs and components available in the JuliaOS Framework.

## Table of Contents

- [Agent System](#agent-system)
- [Cross-Chain Bridge](#cross-chain-bridge)
- [Marketplace](#marketplace)
- [LLM Integration](#llm-integration)
- [Storage](#storage)
- [Trade Validation](#trade-validation)
- [WebSocket Handling](#websocket-handling)
- [Test Mode](#test-mode)

## Agent System

### Agent Interfaces

```typescript
// Base Agent Interface
interface AgentConfig {
  id: string;
  name: string;
  model: string;
  platforms: string[];
  actions: Record<string, any>;
  parameters: Record<string, any>;
}

interface ActionContext {
  agent: Agent;
  parameters: Record<string, any>;
}

type ActionFunction = (context: ActionContext) => Promise<any>;
```

### Agent Class

```typescript
class Agent extends EventEmitter {
  constructor(config: AgentConfig);
  
  // Register an action that this agent can perform
  registerAction(actionName: string, fn: ActionFunction): void;
  
  // Execute a registered action
  executeAction(actionName: string, parameters: Record<string, any>): Promise<any>;
  
  // State management
  setState(key: string, value: any): void;
  getState(key: string): any;
  
  // Getters
  get id(): string;
  get name(): string;
}
```

### SwarmAgent

```typescript
interface SwarmConfig {
  id: string;
  name: string;
  maxAgents: number;
  minAgents: number;
  scalingRules: ScalingRule[];
}

interface ScalingRule {
  metric: string;
  threshold: number;
  action: 'scale-up' | 'scale-down';
  increment: number;
}

class SwarmAgent extends EventEmitter {
  constructor(config: SwarmConfig);
  
  // Agent management
  addAgent(agent: Agent): void;
  removeAgent(agentId: string): void;
  
  // Scaling operations
  scaleUp(count: number): void;
  scaleDown(count: number): void;
  
  // Task execution
  executeTask(task: any): Promise<any>;
  
  // Metrics monitoring
  getMetrics(): SwarmMetrics;
}
```

### Collaboration

```typescript
interface CollaborationConfig {
  id: string;
  name: string;
  agents: Agent[];
  roles: { [agentId: string]: string[] };
}

class AgentCollaboration extends EventEmitter {
  constructor(config: CollaborationConfig);
  
  // Task management
  createTask(task: Omit<Task, 'id' | 'status' | 'assignedAgents'>): Promise<string>;
  executeTask(taskId: string): Promise<any>;
  getTaskStatus(taskId: string): Task['status'];
  getActiveTasks(): Task[];
  
  // Role management
  getAgentsByRole(role: string): Agent[];
}
```

## Cross-Chain Bridge

### Bridge Types

```typescript
interface BridgeConfig {
  sourceChainId: ChainId;
  targetChainId: ChainId;
  sourceTokenAddress: string;
  targetTokenAddress: string;
  bridgeContractAddress: string;
  minAmount: BigNumberish;
  maxAmount: BigNumberish;
  fees: {
    percentage: number;
    fixed: BigNumberish;
  };
}

interface BridgeTransaction {
  id: string;
  sourceChainId: ChainId;
  targetChainId: ChainId;
  sourceAddress: string;
  targetAddress: string;
  amount: BigNumberish;
  status: BridgeTransactionStatus;
  timestamp: number;
  sourceTransactionHash?: string;
  targetTransactionHash?: string;
  error?: string;
}

enum BridgeTransactionStatus {
  PENDING = 'PENDING',
  SOURCE_CONFIRMED = 'SOURCE_CONFIRMED',
  TARGET_INITIATED = 'TARGET_INITIATED',
  TARGET_CONFIRMED = 'TARGET_CONFIRMED',
  FAILED = 'FAILED'
}
```

### Bridge Provider Interface

```typescript
interface IBridgeProvider {
  initiate(
    sourceChainId: ChainId,
    targetChainId: ChainId,
    amount: BigNumberish,
    targetAddress: string
  ): Promise<BridgeTransaction>;
  
  confirm(transactionId: string): Promise<BridgeTransaction>;
  getStatus(transactionId: string): Promise<BridgeTransactionStatus>;
  getSupportedChains(): Promise<ChainId[]>;
  getConfig(sourceChainId: ChainId, targetChainId: ChainId): Promise<BridgeConfig>;
}
```

### EthereumBridgeProvider

```typescript
class EthereumBridgeProvider extends BaseBridgeProvider {
  constructor(
    configs: BridgeConfig[],
    providerUrls: Map<ChainId, string>,
    signer: ethers.Signer
  );
  
  async getSupportedChains(): Promise<ChainId[]>;
}
```

## Marketplace

### Smart Contract Methods

```solidity
// JuliaMarketplace.sol

function publishModule(string memory name, string memory description, uint256 price) external;
function purchaseModule(uint256 moduleId) external payable;
function listItem(string memory name, string memory description, uint256 price) external;
function updatePlatformFee(uint256 newFee) external onlyOwner;
function withdrawFees() external onlyOwner;
```

### JavaScript API

```typescript
class MarketplaceClient {
  constructor(contractAddress: string, provider: ethers.JsonRpcProvider);
  
  async publishModule(name: string, description: string, price: number): Promise<TransactionReceipt>;
  async purchaseModule(moduleId: number): Promise<TransactionReceipt>;
  async listItem(name: string, description: string, price: number): Promise<TransactionReceipt>;
  async getModuleDetails(moduleId: number): Promise<Module>;
  async getItemDetails(itemId: number): Promise<Item>;
}
```

## LLM Integration

### Provider Interface

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

interface LLMProvider extends EventEmitter {
  init(config: LLMConfig): Promise<void>;
  complete(messages: Message[]): Promise<LLMResponse>;
  streamComplete?(messages: Message[]): AsyncGenerator<string>;
  getName(): string;
  getAvailableModels?(): Promise<string[]>;
  validateConfig(config: LLMConfig): boolean;
}
```

### Concrete Implementations

#### OpenAI Provider

```typescript
interface OpenAIConfig extends LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organization?: string;
}

class OpenAIProvider extends BaseLLMProvider {
  constructor();
  async init(config: OpenAIConfig): Promise<void>;
  async complete(messages: Message[]): Promise<LLMResponse>;
  async *streamComplete(messages: Message[]): AsyncGenerator<string>;
  async getAvailableModels(): Promise<string[]>;
  getName(): string;
  validateConfig(config: OpenAIConfig): boolean;
}
```

#### Anthropic Provider

```typescript
interface AnthropicConfig extends LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class AnthropicProvider extends BaseLLMProvider {
  constructor();
  async init(config: AnthropicConfig): Promise<void>;
  async complete(messages: Message[]): Promise<LLMResponse>;
  async *streamComplete(messages: Message[]): AsyncGenerator<string>;
  async getAvailableModels(): Promise<string[]>;
  getName(): string;
  validateConfig(config: AnthropicConfig): boolean;
}
```

## Storage

### Arweave Storage

```typescript
interface ArweaveConfig {
  host: string;
  port: number;
  protocol: string;
  timeout: number;
  logging: boolean;
}

interface StorageMetadata {
  contentType?: string;
  tags?: { name: string; value: string }[];
  encrypted?: boolean;
}

class ArweaveStorage {
  constructor(config: ArweaveConfig, wallet: JWKInterface);
  
  async store(data: string | Buffer, metadata?: StorageMetadata): Promise<string>;
  async retrieve(id: string): Promise<{ data: string | Buffer; metadata: StorageMetadata }>;
  async query(tags: { name: string; value: string }[], options?: QueryOptions): Promise<QueryResult<any>>;
  async encrypt(data: string | Buffer, recipientPublicKey: string): Promise<string>;
  async decrypt(encryptedData: string, senderPublicKey: string): Promise<string>;
}
```

## Trade Validation

### validateTrade(trade: Trade): Promise<boolean>

Validates a trade before execution. Throws an error if the trade is invalid.

Parameters:
- `trade`: Trade object containing:
  - `pair`: string - Trading pair (e.g., 'SOL/USDC')
  - `type`: 'buy' | 'sell' - Trade type
  - `amount`: number - Trade amount
  - `price`: number - Optional limit price

Returns:
- Promise<boolean> - True if trade is valid, throws error otherwise

Validation checks:
- Position size limits (prevents exceeding maximum allowed position)
- Portfolio balance sufficiency (ensures sufficient funds for trade)
- Market liquidity requirements (checks minimum required volume)
- Price impact analysis (prevents excessive slippage)
- Test mode error simulation (throws configured test errors)
- Market condition validation (checks if market is active and liquid)
- Base currency balance verification (for sell orders)
- Quote currency balance verification (for buy orders)

Error types:
- `InsufficientBalanceError`: Thrown when portfolio lacks required funds
- `PositionLimitError`: Thrown when trade would exceed position limits
- `MarketLiquidityError`: Thrown when market lacks sufficient liquidity
- `TestModeError`: Thrown when test mode is configured to simulate errors
- `MarketConditionError`: Thrown when market conditions are unfavorable
- `ValidationError`: Thrown for general validation failures

### executeTrade(trade: Trade): Promise<TradeResult>

Executes a validated trade and updates portfolio balances with precise calculations.

Parameters:
- `trade`: Trade object (see validateTrade)

Returns:
- Promise<TradeResult>:
  - `success`: boolean
  - `timestamp`: number
  - `portfolio`: Portfolio - Updated portfolio state
  - `tradeCost`: number - Actual cost of trade
  - `error?`: string - Error message if trade failed

Balance calculation:
- Uses Math.floor for cost calculations to prevent rounding errors
- Updates both base and quote currency balances atomically
- Maintains precise decimal handling for all currencies
- Updates total portfolio value based on current market prices
- Handles partial fills and slippage adjustments
- Calculates total portfolio value in USDC
- Updates portfolio timestamp after trade execution
- Maintains atomic balance updates to prevent inconsistencies

Example:
```typescript
try {
  const trade = {
    pair: 'SOL/USDC',
    type: 'buy',
    amount: 0.1,
    price: 100
  };
  
  await validateTrade(trade);
  const result = await executeTrade(trade);
  
  console.log(`Trade executed: ${result.success}`);
  console.log(`New portfolio:`, result.portfolio);
  console.log(`Total value: ${result.portfolio.totalValue} USDC`);
} catch (error) {
  console.error(`Trade failed: ${error.message}`);
}
```

## WebSocket Handling

### MockWebSocket

Enhanced interface for WebSocket mocking in test mode:

```typescript
interface MockWebSocket {
  on(event: string, handler: (data: string | Buffer) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  close(): void;
  send(data: string | Buffer): void;
  emit(event: string, data: any): void;
  isConnected(): boolean;
  getMessageHistory(): any[];
  messageHandler?: (data: string | Buffer) => void;
  errorHandler?: (error: Error) => void;
}
```

### initializeWebSocket()

Initializes WebSocket connection with comprehensive error handling:

```typescript
async function initializeWebSocket(config: WebSocketConfig): Promise<WebSocket | MockWebSocket> {
  if (process.env.NODE_ENV === 'test') {
    const mockWs = new MockWebSocket(config);
    mockWs.messageHandler = (data: string | Buffer) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'market_data') {
        this.marketData = parsed.data;
      }
    };
    mockWs.errorHandler = (error: Error) => {
      this.errorHandler(error);
    };
    return mockWs;
  }
  
  const ws = new WebSocket(config.url);
  
  ws.on('message', (data: string | Buffer) => {
    const parsed = JSON.parse(data.toString());
    if (parsed.type === 'market_data') {
      this.marketData = parsed.data;
    }
  });
  
  ws.on('error', (error: Error) => {
    this.errorHandler(error);
  });
  
  return ws;
}
```

Features:
- Handles both real and mock WebSocket connections
- Processes market data updates with type safety
- Manages error states with custom error handler
- Provides connection status monitoring
- Maintains message history in test mode
- Supports both string and Buffer message types
- Implements automatic reconnection logic
- Provides cleanup on close with resource management
- Exposes message and error handlers for testing
- Maintains consistent interface between real and mock WebSockets
- Supports event emission for test scenarios
- Provides type-safe event handling

Example:
```typescript
const ws = await initializeWebSocket({
  url: 'wss://api.example.com',
  reconnect: true,
  timeout: 5000
});

ws.on('market_data', (data) => {
  console.log('Received market data:', data);
});

// In test mode
if (process.env.NODE_ENV === 'test') {
  const mockWs = ws as MockWebSocket;
  mockWs.emit('market_data', { price: 100, volume: 1000 });
  const history = mockWs.getMessageHistory();
  console.log('Message history:', history);
  
  // Test error handling
  mockWs.emit('error', new Error('Connection failed'));
}
```

## Test Mode

### Configuration

```typescript
interface TestConfig {
  testMode: boolean;
  testError?: boolean;
  mockMarketData?: {
    [pair: string]: {
      price: number;
      volume: number;
    }
  }
}
```

### Error Simulation

Test mode supports simulating various error conditions:
- WebSocket connection failures
- Trade validation errors
- Portfolio balance errors
- Market data errors
