import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { BaseWalletProvider } from './BaseWalletProvider';
import { SolanaWalletProvider } from '../types';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect(): Promise<{ publicKey: PublicKey }>;
      disconnect(): Promise<void>;
      signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
      signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>;
      signAllTransactions(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]>;
      on(event: string, callback: (args: any) => void): void;
      removeListener(event: string, callback: (args: any) => void): void;
    };
  }
}

export class PhantomProvider extends BaseWalletProvider implements SolanaWalletProvider {
  private connection: Connection | null = null;
  private publicKey: PublicKey | null = null;

  protected checkAvailability(): boolean {
    return typeof window !== 'undefined' && !!window.solana?.isPhantom;
  }

  protected setupEventListeners(): void {
    if (!window.solana) return;

    window.solana.on('connect', (publicKey: PublicKey) => {
      this.publicKey = publicKey;
      this.setState({
        address: publicKey.toString(),
        isConnected: true,
        isConnecting: false
      });
      this.emitEvent('connect', { publicKey });
    });

    window.solana.on('disconnect', () => {
      this.disconnect();
    });

    window.solana.on('accountChanged', (publicKey: PublicKey | null) => {
      if (publicKey) {
        this.publicKey = publicKey;
        this.setState({ address: publicKey.toString() });
        this.emitEvent('accountsChanged', publicKey.toString());
      } else {
        this.disconnect();
      }
    });
  }

  public async connect(): Promise<void> {
    if (!this.checkAvailability()) {
      throw new Error('Phantom wallet is not available');
    }

    try {
      this.setState({ isConnecting: true });
      
      const { publicKey } = await window.solana!.connect();
      this.publicKey = publicKey;
      
      // Initialize connection to Solana network
      this.connection = new Connection('https://api.mainnet-beta.solana.com');
      
      const balance = await this.connection.getBalance(publicKey);

      this.setState({
        address: publicKey.toString(),
        isConnected: true,
        isConnecting: false
      });

      this.emitEvent('connect', { publicKey, balance });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (window.solana) {
      await window.solana.disconnect();
    }
    
    this.publicKey = null;
    this.connection = null;
    
    this.setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false
    });
    
    this.emitEvent('disconnect');
  }

  public async signMessage(message: string): Promise<string> {
    if (!window.solana || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await window.solana.signMessage(encodedMessage);
    return Buffer.from(signature).toString('hex');
  }

  public async getAddress(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.publicKey.toString();
  }

  public async getBalance(): Promise<string> {
    if (!this.connection || !this.publicKey) {
      throw new Error('Wallet not connected');
    }
    const balance = await this.connection.getBalance(this.publicKey);
    return (balance / 1e9).toString(); // Convert lamports to SOL
  }

  public async switchNetwork(chainId: number): Promise<void> {
    // Solana doesn't support network switching in the same way as Ethereum
    throw new Error('Network switching not supported for Solana');
  }

  public async getChainId(): Promise<number> {
    // Solana doesn't use chain IDs
    return 0;
  }

  public async getPublicKey(): Promise<PublicKey> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return this.publicKey;
  }

  public async signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
    if (!window.solana || !this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return window.solana.signTransaction(transaction);
  }

  public async signAllTransactions(transactions: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> {
    if (!window.solana || !this.publicKey) {
      throw new Error('Wallet not connected');
    }
    return window.solana.signAllTransactions(transactions);
  }
} 