# Wallet Setup and Configuration Guide

This guide will help you set up and configure your wallets for use with the J3OS Framework.

## Supported Wallets

The J3OS Framework supports the following wallet types:

1. **MetaMask**
   - Best for Ethereum and EVM-compatible chains
   - Supports multiple networks
   - Easy to use with browser extensions

2. **Phantom**
   - Best for Solana ecosystem
   - Supports SPL tokens
   - Native Solana integration

3. **Rabby**
   - Multi-chain wallet
   - Supports multiple networks
   - Advanced features for DeFi

4. **Custom RPC**
   - For custom network configurations
   - Supports any EVM-compatible chain
   - Flexible setup options

## Setup Instructions

### 1. MetaMask Setup

1. Install MetaMask browser extension
2. Create a new account or import existing
3. Configure networks:
   ```bash
   # Add custom networks if needed
   j3os wallet add-network --name "Custom Network" --rpc-url "https://your-rpc-url" --chain-id 123
   ```
4. Export private key (optional, for CLI usage):
   - Open MetaMask
   - Go to Account Details
   - Click "Export Private Key"
   - Save securely

### 2. Phantom Setup

1. Install Phantom browser extension
2. Create a new account or import existing
3. Configure networks:
   ```bash
   # Add custom Solana networks
   j3os wallet add-network --name "Custom Solana" --rpc-url "https://your-solana-rpc" --network solana
   ```
4. Export private key (optional, for CLI usage):
   - Open Phantom
   - Go to Settings
   - Click "Export Private Key"
   - Save securely

### 3. Rabby Setup

1. Install Rabby browser extension
2. Create a new account or import existing
3. Configure networks:
   ```bash
   # Add custom networks
   j3os wallet add-network --name "Custom Network" --rpc-url "https://your-rpc-url" --chain-id 123
   ```
4. Export private key (optional, for CLI usage):
   - Open Rabby
   - Go to Settings
   - Click "Export Private Key"
   - Save securely

### 4. Custom RPC Setup

1. Configure custom RPC:
   ```bash
   j3os wallet add-network \
     --name "Custom Network" \
     --rpc-url "https://your-rpc-url" \
     --chain-id 123 \
     --symbol "CUSTOM" \
     --decimals 18
   ```

2. Set up wallet:
   ```bash
   j3os wallet configure \
     --type custom \
     --rpc-url "https://your-rpc-url" \
     --chain-id 123
   ```

## Environment Variables

For CLI usage, set up the following environment variables:

```bash
# Required variables
WEB3_PROVIDER="https://your-rpc-url"
API_KEY="your-api-key"
WALLET_PRIVATE_KEY="your-private-key"

# Optional variables
ELASTICSEARCH_URL="https://your-elasticsearch-url"  # For logging
LOG_LEVEL="info"  # For logging level
```

## Security Best Practices

1. **Private Key Management**
   - Never share your private key
   - Store securely (hardware wallet recommended)
   - Use environment variables for CLI
   - Consider using a key management service

2. **Network Security**
   - Use HTTPS RPC URLs
   - Verify network configurations
   - Test on testnet first
   - Monitor for suspicious activity

3. **Transaction Safety**
   - Set gas limits appropriately
   - Use nonce management
   - Implement transaction signing
   - Monitor transaction status

## Monitoring and Alerts

Set up monitoring for your wallets:

```bash
# Monitor wallet balance
j3os monitor add \
  --type balance \
  --network ethereum \
  --address "your-address" \
  --threshold 0.1 \
  --alert "Low balance alert"

# Monitor transaction status
j3os monitor add \
  --type transaction \
  --network ethereum \
  --status failed \
  --alert "Transaction failed alert"
```

## Backup and Recovery

1. **Backup Configuration**
   ```bash
   j3os wallet backup --output wallet-backup.json
   ```

2. **Restore Configuration**
   ```bash
   j3os wallet restore --input wallet-backup.json
   ```

3. **Recovery Process**
   - Use seed phrase if available
   - Import private key to new wallet
   - Reconfigure networks
   - Verify balances and permissions

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Check RPC URL validity
   - Verify network status
   - Check firewall settings
   - Test with different RPC provider

2. **Transaction Failures**
   - Check gas settings
   - Verify account balance
   - Check network congestion
   - Review transaction parameters

3. **Permission Issues**
   - Check wallet permissions
   - Verify network access
   - Review API key permissions
   - Check account restrictions

## Support

For additional support:
- Join our Discord community
- Check the documentation
- Contact support team
- Review GitHub issues 