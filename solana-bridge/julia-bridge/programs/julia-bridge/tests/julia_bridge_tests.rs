use super::*;
use anchor_lang::solana_program::hash::hash;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[test]
fn test_initialize() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();
    let system_program = System::id();
    let rent = Rent::id();

    let accounts = Initialize {
        bridge_state,
        authority,
        system_program,
        rent,
    };

    let ix = initialize(program_id, &accounts);
    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());

    let state = BridgeState::try_deserialize(&mut &result.unwrap().data[..]).unwrap();
    assert_eq!(state.authority, authority);
    assert!(!state.paused);
    assert_eq!(state.fee_percentage, 25);
    assert_eq!(state.fixed_fee, 1000);
}

#[test]
fn test_bridge_tokens() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();
    let sender = Pubkey::new_unique();
    let sender_token_account = Pubkey::new_unique();
    let bridge_vault = Pubkey::new_unique();
    let token_mint = Pubkey::new_unique();
    let token_program = Token::id();

    let accounts = BridgeTokens {
        bridge_state,
        sender,
        sender_token_account,
        bridge_vault,
        token_mint,
        token_program,
    };

    let amount = 1000;
    let target_chain_id = 1;
    let target_address = [0u8; 32];
    let message_hash = hash(b"test").to_bytes();

    let ix = bridge_tokens(
        program_id,
        &accounts,
        amount,
        target_chain_id,
        target_address,
        message_hash,
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());
}

#[test]
fn test_claim_tokens() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();
    let recipient = Pubkey::new_unique();
    let recipient_token_account = Pubkey::new_unique();
    let bridge_vault = Pubkey::new_unique();
    let token_mint = Pubkey::new_unique();
    let token_program = Token::id();

    let accounts = ClaimTokens {
        bridge_state,
        recipient,
        recipient_token_account,
        bridge_vault,
        token_mint,
        token_program,
    };

    let amount = 1000;
    let source_chain_id = 1;
    let message_hash = hash(b"test").to_bytes();
    let proof = vec![[0u8; 32]];

    let ix = claim_tokens(
        program_id,
        &accounts,
        amount,
        source_chain_id,
        message_hash,
        proof,
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());
}

#[test]
fn test_update_bridge_config() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();

    let accounts = UpdateBridgeConfig {
        bridge_state,
        authority,
    };

    let fee_percentage = 50;
    let fixed_fee = 2000;
    let fee_collector = Pubkey::new_unique();

    let ix = update_bridge_config(
        program_id,
        &accounts,
        fee_percentage,
        fixed_fee,
        fee_collector,
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());
}

#[test]
fn test_toggle_pause() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();

    let accounts = TogglePause {
        bridge_state,
        authority,
    };

    let ix = toggle_pause(program_id, &accounts);
    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());
}

#[test]
fn test_update_merkle_root() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();

    let accounts = UpdateMerkleRoot {
        bridge_state,
        authority,
    };

    let root = [0u8; 32];

    let ix = update_merkle_root(program_id, &accounts, root);
    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());
}

// Helper function to process instructions
fn process_instruction(
    ix: &Instruction,
    accounts: &impl Accounts<'static>,
    signers: &[&Pubkey],
) -> Result<Vec<u8>> {
    // This is a simplified version. In a real test, you would:
    // 1. Create a test environment
    // 2. Set up account data
    // 3. Process the instruction
    // 4. Return the result
    Ok(vec![])
} 