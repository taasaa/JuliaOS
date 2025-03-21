import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { JuliaBridgeTest } from "../target/types/julia_bridge_test";

describe("julia-bridge-test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.JuliaBridgeTest as Program<JuliaBridgeTest>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
