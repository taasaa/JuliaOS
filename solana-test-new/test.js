const { Connection, Keypair } = require('@solana/web3.js');
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
      console.log(`Balance: ${balance / 1e9} SOL`);
    } else {
      console.log('No private key found in environment variables');
    }

  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

main().catch(console.error); 