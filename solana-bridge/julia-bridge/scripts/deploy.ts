import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { JuliaBridge } from "../target/types/julia_bridge";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import * as fs from "fs";

async function main() {
    // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.JuliaBridge as Program<JuliaBridge>;
    const connection = provider.connection;

    // Generate a new keypair for the bridge state
    const bridgeStateKeypair = Keypair.generate();
    const bridgeStatePda = await PublicKey.findProgramAddress(
        [Buffer.from("bridge_state")],
        program.programId
    );

    // Create a new token mint for testing
    const mintKeypair = await createMint(
        connection,
        provider.wallet.payer,
        provider.wallet.publicKey,
        null,
        9
    );

    // Create bridge vault
    const bridgeVaultKeypair = await createAccount(
        connection,
        provider.wallet.payer,
        mintKeypair,
        bridgeStatePda[0]
    );

    // Request airdrop for the bridge state account
    const airdropSignature = await connection.requestAirdrop(
        bridgeStateKeypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);

    // Initialize the bridge
    try {
        const tx = await program.methods
            .initialize()
            .accounts({
                bridgeState: bridgeStatePda[0],
                authority: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .signers([bridgeStateKeypair])
            .rpc();

        console.log("Bridge initialized successfully!");
        console.log("Transaction signature:", tx);

        // Save deployment information
        const deploymentInfo = {
            programId: program.programId.toString(),
            bridgeState: bridgeStatePda[0].toString(),
            authority: provider.wallet.publicKey.toString(),
            mint: mintKeypair.toString(),
            bridgeVault: bridgeVaultKeypair.toString(),
            timestamp: new Date().toISOString(),
        };

        fs.writeFileSync(
            "deployment.json",
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Verify deployment
        const bridgeState = await program.account.bridgeState.fetch(
            bridgeStatePda[0]
        );
        console.log("Bridge State:", {
            authority: bridgeState.authority.toString(),
            paused: bridgeState.paused,
            feePercentage: bridgeState.feePercentage,
            fixedFee: bridgeState.fixedFee.toString(),
        });

    } catch (error) {
        console.error("Error deploying bridge:", error);
    }
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error(err);
        process.exit(1);
    }
); 