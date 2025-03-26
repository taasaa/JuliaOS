const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer
} = require('@solana/spl-token');
require('dotenv').config();

async function main() {
  try {
    // Initialize connection
    const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
    
    // Test connection
    const slot = await connection.getSlot();
    console.log(`Connected to Solana mainnet! Current slot: ${slot}`);

    // Test wallet
    if (process.env.PRIVATE_KEY) {
      // Convert private key from array format to Uint8Array
      const privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
      const secretKey = new Uint8Array(privateKeyArray);
      const keypair = Keypair.fromSecretKey(secretKey);
      
      // Get wallet info
      const balance = await connection.getBalance(keypair.publicKey);
      console.log(`Wallet address: ${keypair.publicKey.toString()}`);
      console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

      // 1. Test sending SOL
      console.log('\nTesting SOL transfer...');
      const recipientAddress = new PublicKey('GUiD1DfUTpK3kjtiiQSkmWUVAengNQ84PQeQpuc4Yn2y'); // Replace with actual recipient
      const transferAmount = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientAddress,
          lamports: transferAmount,
        })
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair]
      );
      console.log(`SOL transfer successful! Signature: ${signature}`);

      // 2. Test creating and transferring tokens
      console.log('\nTesting token creation and transfer...');
      
      // Create a new token mint
      const mint = await createMint(
        connection,
        keypair,
        keypair.publicKey,
        null,
        9 // 9 decimals
      );
      console.log(`Created new token mint: ${mint.toString()}`);

      // Create token account for sender
      const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
      );
      console.log(`Sender token account: ${senderTokenAccount.address.toString()}`);

      // Create token account for recipient
      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        recipientAddress
      );
      console.log(`Recipient token account: ${recipientTokenAccount.address.toString()}`);

      // Mint some tokens to sender
      const mintAmount = 1000000000; // 1 token with 9 decimals
      await mintTo(
        connection,
        keypair,
        mint,
        senderTokenAccount.address,
        keypair,
        mintAmount
      );
      console.log(`Minted ${mintAmount / 1e9} tokens to sender`);

      // Transfer tokens to recipient
      const transferTokenAmount = 500000000; // 0.5 tokens
      await transfer(
        connection,
        keypair,
        senderTokenAccount.address,
        recipientTokenAccount.address,
        keypair,
        transferTokenAmount
      );
      console.log(`Transferred ${transferTokenAmount / 1e9} tokens to recipient`);

      // 3. Test program interaction (example with a simple program)
      console.log('\nTesting program interaction...');
      // Note: This is a placeholder. You'll need to replace with actual program ID and instruction
      const programId = new PublicKey('11111111111111111111111111111111'); // Replace with actual program ID
      console.log('Program interaction test completed (placeholder)');

    } else {
      console.log('No private key found in environment variables');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 