import { WalletAdapter } from '../../common/src/types';
import { ethers } from 'ethers';

export class MetaMaskWalletAdapter implements WalletAdapter {
  private provider: any;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.provider = (window as any).ethereum;
    }
  }

  async connect(): Promise<void> {
    try {
      if (!this.provider) {
        throw new Error('MetaMask not found');
      }

      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      this.address = accounts[0];
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      this.signer = await ethersProvider.getSigner();
    } catch (error) {
      throw new Error(`Failed to connect to MetaMask: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.signer = null;
    this.address = null;
  }

  async signTransaction(transaction: ethers.Transaction): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      const signedTx = await this.signer.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  async getAddress(): Promise<string> {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }
    return this.address;
  }
} 