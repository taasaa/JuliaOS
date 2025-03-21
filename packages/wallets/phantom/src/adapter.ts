import { WalletAdapter, ChainConfig } from '../../common/src/types';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export class PhantomWalletAdapter implements WalletAdapter {
  private provider: any;
  private connection: Connection;
  private publicKey: PublicKey | null = null;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    if (typeof window !== 'undefined') {
      this.provider = (window as any).solana;
    }
  }

  async connect(): Promise<void> {
    try {
      if (!this.provider) {
        throw new Error('Phantom wallet not found');
      }
      const response = await this.provider.connect();
      this.publicKey = new PublicKey(response.publicKey.toString());
    } catch (error) {
      throw new Error(`Failed to connect to Phantom wallet: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.provider.disconnect();
      this.publicKey = null;
    } catch (error) {
      throw new Error(`Failed to disconnect from Phantom wallet: ${error}`);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.provider || !this.publicKey) {
        throw new Error('Wallet not connected');
      }
      const signedTx = await this.provider.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      if (!this.provider || !this.publicKey) {
        throw new Error('Wallet not connected');
      }
      const encodedMessage = new TextEncoder().encode(message);
      const { signature } = await this.provider.signMessage(encodedMessage, 'utf8');
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  async getAddress(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.publicKey.toString();
  }
} 