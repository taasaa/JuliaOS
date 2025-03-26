import { IWalletManager, WalletProvider, WalletState } from './types';
import { MetaMaskProvider } from './providers/MetaMaskProvider';
import { RabbyProvider } from './providers/RabbyProvider';
import { PhantomProvider } from './providers/PhantomProvider';
import { BaseProvider } from './providers/BaseProvider';

export class WalletManager implements IWalletManager {
  private providers: Map<string, WalletProvider>;
  private currentProvider: WalletProvider | null = null;

  constructor() {
    this.providers = new Map([
      ['metamask', new MetaMaskProvider()],
      ['rabby', new RabbyProvider()],
      ['phantom', new PhantomProvider()],
      ['base', new BaseProvider()]
    ]);
  }

  public async connect(providerName: string): Promise<void> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    if (this.currentProvider) {
      await this.currentProvider.disconnect();
    }

    await provider.connect();
    this.currentProvider = provider;
  }

  public async disconnect(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.disconnect();
      this.currentProvider = null;
    }
  }

  public getProvider(providerName: string): WalletProvider | null {
    return this.providers.get(providerName) || null;
  }

  public getCurrentProvider(): WalletProvider | null {
    return this.currentProvider;
  }

  public getState(): WalletState {
    return this.currentProvider ? this.currentProvider.getState() : {
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      supportedChains: []
    };
  }

  public isAvailable(providerName: string): boolean {
    const provider = this.getProvider(providerName);
    return provider ? provider.isAvailable() : false;
  }

  // Helper methods for common operations
  public async signMessage(message: string): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return this.currentProvider.signMessage(message);
  }

  public async getAddress(): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return this.currentProvider.getAddress();
  }

  public async getBalance(): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return this.currentProvider.getBalance();
  }

  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return this.currentProvider.switchNetwork(chainId);
  }

  public async getChainId(): Promise<number> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return this.currentProvider.getChainId();
  }
} 