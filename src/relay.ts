import { ethers } from 'ethers';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import fs from 'fs';
import path from 'path';
import { Logger } from './utils/logger';

// Initialize logger
const logger = new Logger('relay');

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SOLANA_RPC_URL',
  'SOLANA_BRIDGE_PROGRAM_ID',
  'SOLANA_PRIVATE_KEY',
  'BASE_SEPOLIA_RPC_URL',
  'BASE_SEPOLIA_PRIVATE_KEY',
  'BASE_SEPOLIA_BRIDGE_ADDRESS',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Base Sepolia provider and contract
const baseProvider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
const baseWallet = new ethers.Wallet(process.env.BASE_SEPOLIA_PRIVATE_KEY!, baseProvider);
const baseBridge = new ethers.Contract(
  process.env.BASE_SEPOLIA_BRIDGE_ADDRESS!,
  [
    'event TokensBridged(address indexed token, address indexed sender, address indexed recipient, uint256 amount, uint256 targetChainId, bytes32 messageHash)',
    'event TokensClaimed(address indexed token, address indexed recipient, uint256 amount, uint256 sourceChainId, bytes32 messageHash)',
    'function bridge(address token, uint256 amount, address recipient, uint256 targetChainId) returns (bytes32)',
    'function claim(bytes32 messageHash, address recipient, uint256 amount, address token) returns (bool)'
  ],
  baseWallet
);

// Initialize Solana connection and program
const solanaConnection = new Connection(process.env.SOLANA_RPC_URL!);
let solanaWallet: Keypair;

try {
  // Try to load keypair from file path
  const privateKeyPath = process.env.SOLANA_PRIVATE_KEY!;
  if (privateKeyPath.startsWith('~')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const resolvedPath = path.join(homeDir!, privateKeyPath.substring(1));
    const keypairData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    solanaWallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
  } else if (privateKeyPath.startsWith('[')) {
    // Direct array input
    solanaWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKeyPath)));
  } else {
    // File path
    const keypairData = JSON.parse(fs.readFileSync(privateKeyPath, 'utf-8'));
    solanaWallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
  }
} catch (error) {
  logger.error('Failed to load Solana wallet:', error);
  process.exit(1);
}

// Create Anchor provider and program
const solanaProvider = new AnchorProvider(
  solanaConnection,
  new anchor.Wallet(solanaWallet),
  { commitment: 'confirmed' }
);

// Load program IDL from file or fetch from chain
let programIdl;
try {
  programIdl = JSON.parse(fs.readFileSync('./src/idl/julia_bridge.json', 'utf-8'));
} catch (error) {
  logger.error('Failed to load program IDL:', error);
  process.exit(1);
}

const solanaProgram = new Program(
  programIdl,
  new PublicKey(process.env.SOLANA_BRIDGE_PROGRAM_ID!),
  solanaProvider
);

// Relay functions
async function handleBaseToSolana(
  token: string,
  sender: string,
  recipient: Uint8Array,
  amount: bigint,
  targetChainId: number,
  messageHash: string
) {
  try {
    logger.info(`Processing Base->Solana bridge: ${amount} tokens from ${sender} to ${new PublicKey(recipient).toBase58()}`);
    
    // Find bridge state PDA
    const [bridgeState] = await PublicKey.findProgramAddress(
      [Buffer.from('bridge_state')],
      solanaProgram.programId
    );

    // Create proof (in a real implementation, this would be a valid Merkle proof)
    const proof: Uint8Array[] = [];
    
    // Convert the messageHash string to bytes
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    
    // Call Solana program to claim tokens
    const tx = await solanaProgram.methods
      .claimTokens(
        new BN(amount.toString()),
        new BN(process.env.BASE_SEPOLIA_CHAIN_ID!),
        [...messageHashBytes],
        proof
      )
      .accounts({
        bridgeState,
        recipient: new PublicKey(recipient),
        // In a real implementation, you would need to provide all required accounts
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    logger.info(`Solana claim transaction: ${tx}`);
    return tx;
  } catch (error) {
    logger.error('Error processing Base->Solana event:', error);
    throw error;
  }
}

async function handleSolanaToBase(
  sender: PublicKey,
  token: PublicKey,
  amount: BN,
  targetAddress: Uint8Array,
  messageHash: Uint8Array
) {
  try {
    logger.info(`Processing Solana->Base bridge: ${amount} tokens from ${sender.toBase58()} to 0x${Buffer.from(targetAddress).toString('hex')}`);
    
    // Convert target address to Ethereum address format
    const recipient = `0x${Buffer.from(targetAddress).toString('hex')}`;
    
    // Call Base bridge to claim tokens
    const tx = await baseBridge.claim(
      `0x${Buffer.from(messageHash).toString('hex')}`,
      recipient,
      amount.toString(),
      process.env.BASE_SEPOLIA_TEST_TOKEN_ADDRESS,
      { gasLimit: Number(process.env.GAS_LIMIT) || 300000 }
    );

    logger.info(`Base claim transaction: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    logger.error('Error processing Solana->Base event:', error);
    throw error;
  }
}

// Start relay service
async function startRelay() {
  logger.info('Starting Julia Bridge relay service...');
  logger.info(`Solana program ID: ${process.env.SOLANA_BRIDGE_PROGRAM_ID}`);
  logger.info(`Base Sepolia bridge address: ${process.env.BASE_SEPOLIA_BRIDGE_ADDRESS}`);
  
  // Listen for Base Sepolia events
  baseBridge.on('TokensBridged', async (token, sender, recipient, amount, targetChainId, messageHash) => {
    if (targetChainId.toString() === process.env.SOLANA_CHAIN_ID) {
      try {
        await handleBaseToSolana(token, sender, ethers.utils.arrayify(recipient), amount, targetChainId, messageHash);
      } catch (error) {
        logger.error('Failed to process Base->Solana event:', error);
      }
    }
  });

  // Listen for Solana events (requires program subscription)
  solanaProgram.addEventListener('BridgeInitiated', async (event) => {
    try {
      await handleSolanaToBase(
        event.sender,
        event.token,
        event.amount,
        event.targetAddress,
        event.messageHash
      );
    } catch (error) {
      logger.error('Failed to process Solana->Base event:', error);
    }
  });

  logger.info('Relay service started and listening for events');
}

// Error handling for the main process
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the relay service
startRelay().catch(error => {
  logger.error('Failed to start relay service:', error);
  process.exit(1);
}); 