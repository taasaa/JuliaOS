const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config();

// Connect to Solana mainnet
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Your wallet keypair (from previous test)
const wallet = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY))
);

async function main() {
    try {
        console.log('Connected to Solana mainnet!');
        const slot = await connection.getSlot();
        console.log('Current slot:', slot);

        // Get wallet info
        const walletAddress = wallet.publicKey.toString();
        console.log('Wallet address:', walletAddress);

        // Get balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL');

        // Example: Create a new token
        console.log('\nCreating new token...');
        const token = await Token.createMint(
            connection,
            wallet,
            wallet.publicKey,
            wallet.publicKey,
            9 // 9 decimals
        );
        console.log('Token created! Mint address:', token.publicKey.toString());

        // Create token account
        const tokenAccount = await token.createAccount(wallet.publicKey);
        console.log('Token account created:', tokenAccount.toString());

        // Mint some tokens
        const amount = 1000000000; // 1 token with 9 decimals
        await token.mintTo(
            tokenAccount,
            wallet,
            [],
            amount
        );
        console.log('Minted 1 token to account');

        // Get token balance
        const tokenBalance = await token.getAccountInfo(tokenAccount);
        console.log('Token balance:', tokenBalance.amount.toNumber() / Math.pow(10, 9));

    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 