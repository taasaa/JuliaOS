import { ethers } from "hardhat";
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Utility function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Testing Julia Bridge functionality...");

  // ==== BASE SEPOLIA SETUP ====
  const baseProvider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const baseWallet = new ethers.Wallet(process.env.BASE_SEPOLIA_PRIVATE_KEY!, baseProvider);
  console.log(`Base Sepolia wallet address: ${baseWallet.address}`);

  // Connect to deployed contracts
  console.log("Connecting to Base Sepolia bridge contract...");
  const bridgeContract = await ethers.getContractAt(
    "JuliaBridge",
    process.env.BASE_SEPOLIA_BRIDGE_ADDRESS!,
    baseWallet
  );

  console.log("Connecting to test token contract...");
  const tokenContract = await ethers.getContractAt(
    "TestToken",
    process.env.BASE_SEPOLIA_TEST_TOKEN_ADDRESS!,
    baseWallet
  );

  // Check balances
  const baseBalance = await baseProvider.getBalance(baseWallet.address);
  console.log(`Base Sepolia ETH balance: ${ethers.utils.formatEther(baseBalance)} ETH`);

  const tokenBalance = await tokenContract.balanceOf(baseWallet.address);
  console.log(`Test token balance: ${ethers.utils.formatEther(tokenBalance)} TEST`);

  // ==== SOLANA SETUP ====
  const solanaConnection = new Connection(process.env.SOLANA_RPC_URL!);
  let solanaWallet: Keypair;

  // Load Solana wallet
  try {
    const privateKeyPath = process.env.SOLANA_PRIVATE_KEY!;
    if (privateKeyPath.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const resolvedPath = path.join(homeDir!, privateKeyPath.substring(1));
      const keypairData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      solanaWallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
    } else {
      const keypairData = JSON.parse(fs.readFileSync(privateKeyPath, 'utf-8'));
      solanaWallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
    }
    console.log(`Solana wallet address: ${solanaWallet.publicKey.toBase58()}`);
  } catch (error) {
    console.error('Failed to load Solana wallet:', error);
    process.exit(1);
  }

  // Load program
  const solanaProvider = new anchor.AnchorProvider(
    solanaConnection,
    new anchor.Wallet(solanaWallet),
    { commitment: 'confirmed' }
  );

  let programIdl;
  try {
    programIdl = JSON.parse(fs.readFileSync('./src/idl/julia_bridge.json', 'utf-8'));
  } catch (error) {
    console.error('Failed to load program IDL:', error);
    process.exit(1);
  }

  const solanaProgram = new anchor.Program(
    programIdl,
    new PublicKey(process.env.SOLANA_BRIDGE_PROGRAM_ID!),
    solanaProvider
  );

  // Check Solana balances
  const solanaBalance = await solanaConnection.getBalance(solanaWallet.publicKey);
  console.log(`Solana balance: ${solanaBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

  // ==== TEST BRIDGE FUNCTIONALITY ====
  
  // 1. Test Base Sepolia -> Solana
  console.log("\n=== Testing Base Sepolia -> Solana bridge ===");
  
  // Approve token spending by bridge
  const approveAmount = ethers.utils.parseEther("1");
  console.log(`Approving ${ethers.utils.formatEther(approveAmount)} TEST tokens for bridge...`);
  
  const approveTx = await tokenContract.approve(
    bridgeContract.address,
    approveAmount
  );
  await approveTx.wait();
  console.log(`Approved! Transaction: ${approveTx.hash}`);

  // Bridge tokens to Solana
  console.log(`Bridging tokens to Solana...`);
  
  // Convert Solana public key to bytes for Ethereum
  const solanaAddressBytes = Buffer.from(solanaWallet.publicKey.toBytes());
  
  // Bridge tokens
  const bridgeTx = await bridgeContract.bridge(
    tokenContract.address,
    approveAmount,
    `0x${solanaAddressBytes.toString('hex')}`,
    Number(process.env.SOLANA_CHAIN_ID),
    { gasLimit: 300000 }
  );
  
  await bridgeTx.wait();
  console.log(`Bridged! Transaction: ${bridgeTx.hash}`);
  
  // Wait for the relay to process
  console.log("Waiting for relay to process the transaction...");
  await sleep(10000);

  // 2. Test Solana -> Base Sepolia
  console.log("\n=== Testing Solana -> Base Sepolia bridge ===");
  
  // Find bridge state PDA
  const [bridgeState] = await PublicKey.findProgramAddress(
    [Buffer.from('bridge_state')],
    solanaProgram.programId
  );
  
  // Create a test token on Solana
  console.log("Creating a test token on Solana...");
  const tokenMint = await createMint(
    solanaConnection,
    solanaWallet,
    solanaWallet.publicKey,
    null,
    9
  );
  console.log(`Test token created with mint: ${tokenMint.toBase58()}`);
  
  // Create token accounts
  const bridgeVault = await getAssociatedTokenAddress(tokenMint, bridgeState, true);
  
  console.log("Creating bridge vault token account...");
  const vaultIx = createAssociatedTokenAccountInstruction(
    solanaWallet.publicKey,
    bridgeVault,
    bridgeState,
    tokenMint
  );
  
  const userTokenAccount = await getAssociatedTokenAddress(tokenMint, solanaWallet.publicKey);
  
  console.log("Creating user token account...");
  const userIx = createAssociatedTokenAccountInstruction(
    solanaWallet.publicKey,
    userTokenAccount,
    solanaWallet.publicKey,
    tokenMint
  );
  
  const tx = new anchor.web3.Transaction().add(vaultIx).add(userIx);
  await solanaProvider.sendAndConfirm(tx);
  
  // Mint tokens to user
  console.log("Minting tokens to user...");
  await mintTo(
    solanaConnection,
    solanaWallet,
    tokenMint,
    userTokenAccount,
    solanaWallet.publicKey,
    1000000000 // 1 token with 9 decimals
  );
  
  // Bridge tokens to Base
  console.log("Bridging tokens to Base Sepolia...");
  
  // Convert Ethereum address to bytes for Solana
  const targetAddress = new Uint8Array(32);
  const addressBytes = Buffer.from(baseWallet.address.slice(2), 'hex');
  targetAddress.set(addressBytes, 32 - addressBytes.length);
  
  await solanaProgram.methods
    .bridgeTokens(
      new anchor.BN(1000000000), // 1 token
      new anchor.BN(Number(process.env.BASE_SEPOLIA_CHAIN_ID)),
      Array.from(targetAddress),
      Array.from(new Uint8Array(32).fill(1)) // Example message hash
    )
    .accounts({
      bridgeState,
      sender: solanaWallet.publicKey,
      senderTokenAccount: userTokenAccount,
      bridgeVault,
      tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  
  console.log("Tokens bridged from Solana to Base Sepolia!");
  
  // Wait for the relay to process
  console.log("Waiting for relay to process the transaction...");
  await sleep(10000);
  
  console.log("\nBridge test completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 