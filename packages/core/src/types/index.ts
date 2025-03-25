/**
 * Supported blockchain network IDs
 */
export enum ChainId {
  ETHEREUM = 1,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  BASE = 8453,
  BSC = 56,
  AVALANCHE = 43114,
  SOLANA = 999999999, // Placeholder for Solana
}

/**
 * Transaction status states
 */
export enum TransactionStatus {
  PENDING = 'pending',
  MINED = 'mined',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

/**
 * Transaction types
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  SWAP = 'swap',
  APPROVAL = 'approval',
  CONTRACT_INTERACTION = 'contract_interaction',
  CONTRACT_DEPLOYMENT = 'contract_deployment',
  CROSS_CHAIN = 'cross_chain',
}

/**
 * Provider interface for blockchain interactions
 */
export interface Provider {
  getBlockNumber(): Promise<number>;
  getTransactionReceipt(hash: string): Promise<any>;
  getTransaction(hash: string): Promise<any>;
  estimateGas(transaction: any): Promise<any>;
  getGasPrice(): Promise<any>;
  call(transaction: any): Promise<any>;
  sendTransaction(transaction: any): Promise<any>;
}

/**
 * Explorer interface for blockchain explorers
 */
export interface Explorer {
  getTransactionUrl(hash: string): string;
  getAddressUrl(address: string): string;
  getTokenUrl(address: string): string;
  getBlockUrl(blockNumber: number | string): string;
}

/**
 * Account interface
 */
export interface Account {
  address: string;
  chainId: ChainId;
  balance?: string;
  nonce?: number;
} 