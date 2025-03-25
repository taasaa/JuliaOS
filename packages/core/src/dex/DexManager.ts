import { ethers } from 'ethers';
import { ChainId, TokenAmount } from '../types';
import { logger } from '../utils/logger';
import { WalletManager } from '../security/WalletManager';
import { RiskManager } from '../security/RiskManager';

// Uniswap V2 Router ABI
const UNISWAP_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
];

export class DexManager {
  private static instance: DexManager;
  private routers: Map<ChainId, ethers.Contract>;
  private walletManager: WalletManager;
  private riskManager: RiskManager;

  private constructor() {
    this.routers = new Map();
    this.walletManager = WalletManager.getInstance();
    this.riskManager = RiskManager.getInstance();
  }

  public static getInstance(): DexManager {
    if (!DexManager.instance) {
      DexManager.instance = new DexManager();
    }
    return DexManager.instance;
  }

  public async initializeRouter(
    chainId: ChainId,
    routerAddress: string,
    provider: ethers.providers.Provider
  ): Promise<void> {
    try {
      const router = new ethers.Contract(
        routerAddress,
        UNISWAP_ROUTER_ABI,
        provider
      );
      this.routers.set(chainId, router);
      logger.info(`Initialized DEX router for chain ${chainId}`);
    } catch (error) {
      logger.error(`Failed to initialize DEX router: ${error}`);
      throw error;
    }
  }

  public async getAmountOut(
    chainId: ChainId,
    amountIn: TokenAmount,
    path: string[]
  ): Promise<TokenAmount> {
    const router = this.routers.get(chainId);
    if (!router) {
      throw new Error(`No router initialized for chain ${chainId}`);
    }

    try {
      const amounts = await router.getAmountsOut(amountIn.toString(), path);
      return TokenAmount.fromRaw(amounts[amounts.length - 1], 18);
    } catch (error) {
      logger.error(`Failed to get amount out: ${error}`);
      throw error;
    }
  }

  public async swapExactTokensForTokens(
    chainId: ChainId,
    amountIn: TokenAmount,
    amountOutMin: TokenAmount,
    path: string[],
    deadline: number
  ): Promise<any> {
    const router = this.routers.get(chainId);
    if (!router) {
      throw new Error(`No router initialized for chain ${chainId}`);
    }

    try {
      // Validate transaction with risk manager
      const isValid = await this.riskManager.validateTransaction(
        chainId,
        amountIn,
        await router.provider.getGasPrice(),
        0 // Slippage will be calculated by DEX
      );

      if (!isValid) {
        throw new Error('Transaction failed risk validation');
      }

      const walletAddress = this.walletManager.getAddress(chainId);
      const tx = await router.populateTransaction.swapExactTokensForTokens(
        amountIn.toString(),
        amountOutMin.toString(),
        path,
        walletAddress,
        deadline
      );

      const signedTx = await this.walletManager.signTransaction(chainId, tx);
      const receipt = await this.walletManager.sendTransaction(chainId, signedTx);
      
      logger.info(`Swap transaction sent: ${receipt.hash}`);
      return receipt;
    } catch (error) {
      logger.error(`Failed to execute swap: ${error}`);
      throw error;
    }
  }

  public async swapTokensForExactTokens(
    chainId: ChainId,
    amountOut: TokenAmount,
    amountInMax: TokenAmount,
    path: string[],
    deadline: number
  ): Promise<any> {
    const router = this.routers.get(chainId);
    if (!router) {
      throw new Error(`No router initialized for chain ${chainId}`);
    }

    try {
      // Validate transaction with risk manager
      const isValid = await this.riskManager.validateTransaction(
        chainId,
        amountInMax,
        await router.provider.getGasPrice(),
        0 // Slippage will be calculated by DEX
      );

      if (!isValid) {
        throw new Error('Transaction failed risk validation');
      }

      const walletAddress = this.walletManager.getAddress(chainId);
      const tx = await router.populateTransaction.swapTokensForExactTokens(
        amountOut.toString(),
        amountInMax.toString(),
        path,
        walletAddress,
        deadline
      );

      const signedTx = await this.walletManager.signTransaction(chainId, tx);
      const receipt = await this.walletManager.sendTransaction(chainId, signedTx);
      
      logger.info(`Swap transaction sent: ${receipt.hash}`);
      return receipt;
    } catch (error) {
      logger.error(`Failed to execute swap: ${error}`);
      throw error;
    }
  }

  public removeRouter(chainId: ChainId): void {
    this.routers.delete(chainId);
    logger.info(`Removed DEX router for chain ${chainId}`);
  }
} 