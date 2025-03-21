import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { JuliaBridge } from "../target/types/julia_bridge";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { ethers } from "ethers";
import { expect } from "chai";

describe("Julia Bridge Integration", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.JuliaBridge as Program<JuliaBridge>;
    const connection = provider.connection;

    // Ethereum setup
    const ethProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, ethProvider);
    const ethBridgeContract = new ethers.Contract(
        process.env.ETH_BRIDGE_CONTRACT!,
        [
            "event TokensBridged(address indexed token, address indexed sender, address indexed recipient, uint256 amount, uint256 targetChainId, bytes32 messageHash)",
            "function bridge(address token, uint256 amount, address recipient, uint256 targetChainId) returns (bytes32)",
            "function claim(bytes32 messageHash, address recipient, uint256 amount, address token) returns (bool)"
        ],
        ethWallet
    );

    let bridgeState: PublicKey;
    let tokenMint: PublicKey;
    let bridgeVault: PublicKey;
    let userTokenAccount: PublicKey;
    let payer: Keypair;

    before(async () => {
        // Generate bridge state PDA
        [bridgeState] = await PublicKey.findProgramAddress(
            [Buffer.from("bridge_state")],
            program.programId
        );

        // Create test token
        payer = Keypair.generate();
        const airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(airdropSignature);
        
        tokenMint = await createMint(
            connection,
            payer,
            provider.wallet.publicKey,
            null,
            9
        );

        // Create token accounts
        bridgeVault = await getAssociatedTokenAddress(tokenMint, bridgeState);
        const createVaultIx = createAssociatedTokenAccountInstruction(
            payer.publicKey,
            bridgeVault,
            bridgeState,
            tokenMint
        );
        const createVaultTx = new Transaction().add(createVaultIx);
        await connection.sendTransaction(createVaultTx, [payer]);

        userTokenAccount = await getAssociatedTokenAddress(tokenMint, provider.wallet.publicKey);
        const createUserIx = createAssociatedTokenAccountInstruction(
            payer.publicKey,
            userTokenAccount,
            provider.wallet.publicKey,
            tokenMint
        );
        const createUserTx = new Transaction().add(createUserIx);
        await connection.sendTransaction(createUserTx, [payer]);

        // Mint tokens
        await mintTo(
            connection,
            payer,
            tokenMint,
            userTokenAccount,
            provider.wallet.publicKey,
            1000000000
        );
    });

    it("Initializes the bridge", async () => {
        await program.methods
            .initialize()
            .accounts({
                bridgeState,
                authority: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc();

        const state = await program.account.bridgeState.fetch(bridgeState);
        expect(state.authority).to.eql(provider.wallet.publicKey);
        expect(state.paused).to.be.false;
    });

    it("Bridges tokens from Solana to Ethereum", async () => {
        const amount = new anchor.BN(1000000000); // 1 token
        const targetChainId = new anchor.BN(1); // Ethereum mainnet
        const targetAddress = new Uint8Array(32).fill(1); // Example target address
        const messageHash = new Uint8Array(32).fill(2); // Example message hash

        // Bridge tokens
        await program.methods
            .bridgeTokens(
                amount,
                targetChainId,
                targetAddress,
                messageHash
            )
            .accounts({
                bridgeState,
                sender: provider.wallet.publicKey,
                senderTokenAccount: userTokenAccount,
                bridgeVault,
                tokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        // Verify token transfer
        const vaultBalance = await connection.getTokenAccountBalance(bridgeVault);
        expect(vaultBalance.value.amount).to.equal(amount.toString());
    });

    it("Claims tokens from Ethereum to Solana", async () => {
        const amount = new anchor.BN(1000000000); // 1 token
        const sourceChainId = new anchor.BN(1); // Ethereum mainnet
        const messageHash = new Uint8Array(32).fill(3); // Example message hash
        const proof = [new Uint8Array(32).fill(4)]; // Example proof

        // Claim tokens
        await program.methods
            .claimTokens(
                amount,
                sourceChainId,
                messageHash,
                proof
            )
            .accounts({
                bridgeState,
                recipient: provider.wallet.publicKey,
                recipientTokenAccount: userTokenAccount,
                bridgeVault,
                tokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        // Verify token transfer
        const userBalance = await connection.getTokenAccountBalance(userTokenAccount);
        expect(userBalance.value.amount).to.equal(amount.toString());
    });

    it("Updates bridge configuration", async () => {
        const newFeePercentage = 50; // 0.5%
        const newFixedFee = new anchor.BN(2000);
        const newFeeCollector = provider.wallet.publicKey;

        await program.methods
            .updateBridgeConfig(
                newFeePercentage,
                newFixedFee,
                newFeeCollector
            )
            .accounts({
                bridgeState,
                authority: provider.wallet.publicKey,
            })
            .rpc();

        const state = await program.account.bridgeState.fetch(bridgeState);
        expect(state.feePercentage).to.equal(newFeePercentage);
        expect(state.fixedFee).to.eql(newFixedFee);
        expect(state.feeCollector).to.eql(newFeeCollector);
    });

    it("Toggles bridge pause state", async () => {
        await program.methods
            .togglePause()
            .accounts({
                bridgeState,
                authority: provider.wallet.publicKey,
            })
            .rpc();

        const state = await program.account.bridgeState.fetch(bridgeState);
        expect(state.paused).to.be.true;

        // Try to bridge while paused (should fail)
        try {
            await program.methods
                .bridgeTokens(
                    new anchor.BN(1000000000),
                    new anchor.BN(1),
                    new Uint8Array(32),
                    new Uint8Array(32)
                )
                .accounts({
                    bridgeState,
                    sender: provider.wallet.publicKey,
                    senderTokenAccount: userTokenAccount,
                    bridgeVault,
                    tokenMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();
            throw new Error("Bridge should be paused");
        } catch (error) {
            expect(error.toString()).to.include("Bridge is paused");
        }
    });
}); 