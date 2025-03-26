import { configureDeFiTrading } from '../commands/defi';
import { WalletManager } from '@j3os/wallets';
import { SecurityManager } from '@j3os/security';
import { RateLimiter } from '@j3os/utils';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Mock dependencies
jest.mock('@j3os/wallets');
jest.mock('@j3os/security');
jest.mock('@j3os/utils');
jest.mock('fs');
jest.mock('inquirer');

describe('DeFi Configuration', () => {
  let mockWalletManager: jest.Mocked<WalletManager>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let mockRateLimiter: jest.Mocked<RateLimiter>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockWalletManager = {
      validateAddress: jest.fn().mockReturnValue(true),
      getBalance: jest.fn().mockResolvedValue('1.0'),
      checkConnection: jest.fn().mockResolvedValue(true),
      getSupportedNetworks: jest.fn().mockResolvedValue(['ethereum', 'polygon']),
      checkNetworkConnection: jest.fn().mockResolvedValue(true)
    } as any;

    mockSecurityManager = {
      encryptConfig: jest.fn().mockImplementation(config => config),
      setSecureFilePermissions: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockRateLimiter = {
      waitForSlot: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock environment variables
    process.env.WEB3_PROVIDER = 'test-provider';
    process.env.API_KEY = 'test-api-key';
    process.env.WALLET_PRIVATE_KEY = 'test-private-key';
  });

  describe('Wallet Configuration', () => {
    it('should validate wallet address', async () => {
      mockWalletManager.validateAddress.mockReturnValue(false);
      
      await expect(configureDeFiTrading()).rejects.toThrow('Invalid wallet address');
    });

    it('should check wallet balance', async () => {
      mockWalletManager.getBalance.mockResolvedValue('0');
      
      await expect(configureDeFiTrading()).rejects.toThrow('Insufficient wallet balance');
    });

    it('should check network connectivity', async () => {
      mockWalletManager.checkConnection.mockRejectedValue(new Error('Connection failed'));
      
      await expect(configureDeFiTrading()).rejects.toThrow('Connection failed');
    });
  });

  describe('Network Configuration', () => {
    it('should validate supported networks', async () => {
      mockWalletManager.getSupportedNetworks.mockResolvedValue(['ethereum']);
      
      // Mock inquirer to return unsupported network
      require('inquirer').prompt.mockResolvedValueOnce({
        networks: ['ethereum', 'unsupported']
      });
      
      await expect(configureDeFiTrading()).rejects.toThrow('Selected wallet does not support networks');
    });

    it('should check network connectivity', async () => {
      mockWalletManager.checkNetworkConnection.mockRejectedValue(new Error('Network connection failed'));
      
      // Mock inquirer to return network
      require('inquirer').prompt.mockResolvedValueOnce({
        networks: ['ethereum']
      });
      
      await expect(configureDeFiTrading()).rejects.toThrow('Network connection failed');
    });
  });

  describe('Security Measures', () => {
    it('should encrypt sensitive data', async () => {
      const testConfig = { privateKey: 'test-key' };
      
      // Mock inquirer to complete configuration
      require('inquirer').prompt.mockResolvedValueOnce({
        walletType: 'metamask',
        strategy: 'market_making',
        executionType: 'agent',
        networks: ['ethereum']
      });
      
      await configureDeFiTrading();
      
      expect(mockSecurityManager.encryptConfig).toHaveBeenCalled();
    });

    it('should set secure file permissions', async () => {
      // Mock inquirer to complete configuration
      require('inquirer').prompt.mockResolvedValueOnce({
        walletType: 'metamask',
        strategy: 'market_making',
        executionType: 'agent',
        networks: ['ethereum']
      });
      
      await configureDeFiTrading();
      
      expect(mockSecurityManager.setSecureFilePermissions).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting for API calls', async () => {
      // Mock inquirer to complete configuration
      require('inquirer').prompt.mockResolvedValueOnce({
        walletType: 'metamask',
        strategy: 'market_making',
        executionType: 'agent',
        networks: ['ethereum']
      });
      
      await configureDeFiTrading();
      
      expect(mockRateLimiter.waitForSlot).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockWalletManager.checkConnection.mockRejectedValue(new Error('Network error'));
      
      await expect(configureDeFiTrading()).rejects.toThrow('Network error');
    });

    it('should handle wallet errors gracefully', async () => {
      mockWalletManager.validateAddress.mockImplementation(() => {
        throw new Error('Wallet error');
      });
      
      await expect(configureDeFiTrading()).rejects.toThrow('Wallet error');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock inquirer to return invalid input
      require('inquirer').prompt.mockResolvedValueOnce({
        networks: []
      });
      
      await expect(configureDeFiTrading()).rejects.toThrow('Validation error');
    });
  });

  describe('Environment Variables', () => {
    it('should check for required environment variables', async () => {
      delete process.env.WEB3_PROVIDER;
      
      await expect(configureDeFiTrading()).rejects.toThrow('Missing required environment variables');
    });
  });
}); 