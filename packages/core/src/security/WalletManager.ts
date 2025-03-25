import { ethers } from 'ethers';
import { ChainId, Provider } from '../types';
import { logger } from '../utils/logger';
import { RiskManager } from './RiskManager';

export class WalletManager {
  private static instance: WalletManager;
  private wallets: Map<ChainId, ethers.Wallet>;
  private providers: Map<ChainId, Provider>;
  private riskManager: RiskManager;

  private constructor() {
    this.wallets = new Map();
    this.providers = new Map();
    this.riskManager = RiskManager.getInstance();
  }

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  public async initializeWallet(
    chainId: ChainId,
    privateKey: string,
    provider: Provider
  ): Promise<void> {
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      this.wallets.set(chainId, wallet);
      this.providers.set(chainId, provider);
      logger.info(`Initialized wallet for chain ${chainId}`);
    } catch (error) {
      logger.error(`Failed to initialize wallet for chain ${chainId}: ${error}`);
      throw error;
    }
  }

  public async signTransaction(
    chainId: ChainId,
    transaction: any
  ): Promise<string> {
    const wallet = this.wallets.get(chainId);
    if (!wallet) {
      throw new Error(`No wallet initialized for chain ${chainId}`);
    }

    try {
      const signedTx = await wallet.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      logger.error(`Failed to sign transaction: ${error}`);
      throw error;
    }
  }

  public async sendTransaction(
    chainId: ChainId,
    transaction: any
  ): Promise<any> {
    const wallet = this.wallets.get(chainId);
    if (!wallet) {
      throw new Error(`No wallet initialized for chain ${chainId}`);
    }

    try {
      // Validate transaction with risk manager
      const isValid = await this.riskManager.validateTransaction(
        chainId,
        transaction.value,
        transaction.gasPrice,
        0 // Slippage will be calculated by DEX
      );

      if (!isValid) {
        throw new Error('Transaction failed risk validation');
      }

      const tx = await wallet.sendTransaction(transaction);
      logger.info(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      logger.error(`Failed to send transaction: ${error}`);
      throw error;
    }
  }

  public getAddress(chainId: ChainId): string {
    const wallet = this.wallets.get(chainId);
    if (!wallet) {
      throw new Error(`No wallet initialized for chain ${chainId}`);
    }
    return wallet.address;
  }

  public async getBalance(chainId: ChainId): Promise<string> {
    const wallet = this.wallets.get(chainId);
    if (!wallet) {
      throw new Error(`No wallet initialized for chain ${chainId}`);
    }

    try {
      const balance = await wallet.getBalance();
      return balance.toString();
    } catch (error) {
      logger.error(`Failed to get balance: ${error}`);
      throw error;
    }
  }

  public async getNonce(chainId: ChainId): Promise<number> {
    const wallet = this.wallets.get(chainId);
    if (!wallet) {
      throw new Error(`No wallet initialized for chain ${chainId}`);
    }

    try {
      const nonce = await wallet.getTransactionCount();
      return nonce;
    } catch (error) {
      logger.error(`Failed to get nonce: ${error}`);
      throw error;
    }
  }

  public removeWallet(chainId: ChainId): void {
    this.wallets.delete(chainId);
    this.providers.delete(chainId);
    logger.info(`Removed wallet for chain ${chainId}`);
  }
} 