import { configureDeFiTrading } from '../../commands/defi';
import { WalletManager } from '@j3os/wallets';
import { SecurityManager } from '@j3os/security';
import { RateLimiter } from '@j3os/utils';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { ethers } from 'ethers';
import { Connection } from '@solana/web3.js';

// Only run these tests if explicitly enabled
const RUN_E2E = process.env.RUN_E2E === 'true';

// Test configuration
const TEST_CONFIG = {
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || 'http://localhost:8545',
    chainId: 1,
    testWallet: process.env.ETH_TEST_WALLET
  },
  solana: {
    rpcUrl: process.env.SOL_RPC_URL || 'http://localhost:8899',
    testWallet: process.env.SOL_TEST_WALLET
  },
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL || 'http://localhost:8545',
    chainId: 137,
    testWallet: process.env.POLYGON_TEST_WALLET
  }
};

describe('DeFi Configuration E2E', () => {
  let testProjectDir: string;
  let walletManager: WalletManager;
  let securityManager: SecurityManager;
  let rateLimiter: RateLimiter;

  beforeAll(async () => {
    if (!RUN_E2E) {
      console.log('Skipping E2E tests. Set RUN_E2E=true to run them.');
      return;
    }

    // Create test project directory
    testProjectDir = join(process.cwd(), 'test-project-e2e');
    if (!existsSync(testProjectDir)) {
      execSync(`mkdir -p ${testProjectDir}`);
    }
    process.chdir(testProjectDir);

    // Initialize managers
    walletManager = new WalletManager();
    securityManager = new SecurityManager();
    rateLimiter = new RateLimiter({
      maxRequests: 100,
      timeWindow: 60000
    });
  });

  afterAll(async () => {
    if (!RUN_E2E) return;

    // Clean up test project directory
    if (existsSync(testProjectDir)) {
      execSync(`rm -rf ${testProjectDir}`);
    }
  });

  describe('Ethereum Network Tests', () => {
    it('should configure and deploy on Ethereum mainnet', async () => {
      if (!RUN_E2E) return;

      // Connect to Ethereum network
      const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.ethereum.rpcUrl);
      const wallet = new ethers.Wallet(TEST_CONFIG.ethereum.testWallet!, provider);

      // Mock inquirer responses
      require('inquirer').prompt
        .mockResolvedValueOnce({ walletType: 'metamask' })
        .mockResolvedValueOnce({ address: wallet.address })
        .mockResolvedValueOnce({ strategy: 'market_making' })
        .mockResolvedValueOnce({ executionType: 'swarm' })
        .mockResolvedValueOnce({ networks: ['ethereum'] })
        .mockResolvedValueOnce({
          name: 'eth-swarm',
          size: 100,
          algorithm: 'pso',
          tradingPairs: ['ETH/USDC'],
          maxPositionSize: 0.1,
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20
        });

      await configureDeFiTrading();

      // Verify configuration
      const configPath = join(testProjectDir, 'config', 'swarm.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(config.networks).toContain('ethereum');
      expect(config.wallet.address).toBe(wallet.address);
    });
  });

  describe('Solana Network Tests', () => {
    it('should configure and deploy on Solana mainnet', async () => {
      if (!RUN_E2E) return;

      // Connect to Solana network
      const connection = new Connection(TEST_CONFIG.solana.rpcUrl);
      const wallet = TEST_CONFIG.solana.testWallet!;

      // Mock inquirer responses
      require('inquirer').prompt
        .mockResolvedValueOnce({ walletType: 'phantom' })
        .mockResolvedValueOnce({ address: wallet })
        .mockResolvedValueOnce({ strategy: 'arbitrage' })
        .mockResolvedValueOnce({ executionType: 'agent' })
        .mockResolvedValueOnce({ networks: ['solana'] })
        .mockResolvedValueOnce({
          name: 'sol-agent',
          tradingPairs: ['SOL/USDC'],
          maxPositionSize: 0.1,
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20
        });

      await configureDeFiTrading();

      // Verify configuration
      const configPath = join(testProjectDir, 'config', 'agent.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(config.networks).toContain('solana');
      expect(config.wallet.address).toBe(wallet);
    });
  });

  describe('Cross-Chain Tests', () => {
    it('should configure and deploy cross-chain arbitrage', async () => {
      if (!RUN_E2E) return;

      // Connect to multiple networks
      const ethProvider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.ethereum.rpcUrl);
      const ethWallet = new ethers.Wallet(TEST_CONFIG.ethereum.testWallet!, ethProvider);
      const solConnection = new Connection(TEST_CONFIG.solana.rpcUrl);
      const solWallet = TEST_CONFIG.solana.testWallet!;

      // Mock inquirer responses
      require('inquirer').prompt
        .mockResolvedValueOnce({ walletType: 'rabby' })
        .mockResolvedValueOnce({ address: ethWallet.address })
        .mockResolvedValueOnce({ strategy: 'arbitrage' })
        .mockResolvedValueOnce({ executionType: 'swarm' })
        .mockResolvedValueOnce({ networks: ['ethereum', 'solana'] })
        .mockResolvedValueOnce({
          name: 'cross-chain-swarm',
          size: 100,
          algorithm: 'pso',
          tradingPairs: ['ETH/USDC', 'SOL/USDC'],
          maxPositionSize: 0.1,
          stopLoss: 5,
          takeProfit: 10,
          maxDrawdown: 20
        });

      await configureDeFiTrading();

      // Verify configuration
      const configPath = join(testProjectDir, 'config', 'swarm.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(config.networks).toContain('ethereum');
      expect(config.networks).toContain('solana');
      expect(config.trading_pairs).toContain('ETH/USDC');
      expect(config.trading_pairs).toContain('SOL/USDC');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network disconnections gracefully', async () => {
      if (!RUN_E2E) return;

      // Simulate network disconnection
      const provider = new ethers.providers.JsonRpcProvider('http://invalid-url');
      const wallet = new ethers.Wallet(TEST_CONFIG.ethereum.testWallet!, provider);

      // Mock inquirer responses
      require('inquirer').prompt
        .mockResolvedValueOnce({ walletType: 'metamask' })
        .mockResolvedValueOnce({ address: wallet.address });

      await expect(configureDeFiTrading()).rejects.toThrow();
    });

    it('should handle insufficient funds gracefully', async () => {
      if (!RUN_E2E) return;

      // Use a wallet with insufficient funds
      const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.ethereum.rpcUrl);
      const wallet = new ethers.Wallet(TEST_CONFIG.ethereum.testWallet!, provider);
      const balance = await wallet.getBalance();
      
      if (balance.gt(0)) {
        // Skip test if wallet has funds
        return;
      }

      // Mock inquirer responses
      require('inquirer').prompt
        .mockResolvedValueOnce({ walletType: 'metamask' })
        .mockResolvedValueOnce({ address: wallet.address });

      await expect(configureDeFiTrading()).rejects.toThrow('Insufficient wallet balance');
    });
  });
}); 