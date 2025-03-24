use super::*;
use anchor_lang::solana_program::hash::hash;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::collections::HashMap;

#[test]
fn test_bridge_initialization() {
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
fn test_bridge_tokens_with_fees() {
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

    let amount = 10000; // 10000 tokens
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

    // Verify fees were calculated correctly
    let state = BridgeState::try_deserialize(&mut &result.unwrap().data[..]).unwrap();
    let fee_percentage = state.fee_percentage as u64;
    let fee_amount = (amount * fee_percentage) / 10000;
    let fixed_fee = state.fixed_fee;
    let total_fee = fee_amount + fixed_fee;
    let transfer_amount = amount - total_fee;

    assert_eq!(transfer_amount, 9740); // 10000 - (25 + 1000) = 9740
}

#[test]
fn test_claim_tokens_with_proof() {
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

    // Verify message was marked as processed
    let state = BridgeState::try_deserialize(&mut &result.unwrap().data[..]).unwrap();
    assert!(state.processed_messages.contains(&message_hash));
}

#[test]
fn test_bridge_pause_and_resume() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();

    // Test pause
    let pause_accounts = TogglePause {
        bridge_state,
        authority,
    };

    let pause_ix = toggle_pause(program_id, &pause_accounts);
    let pause_result = process_instruction(&pause_ix, &pause_accounts, &[]);
    assert!(pause_result.is_ok());

    let state = BridgeState::try_deserialize(&mut &pause_result.unwrap().data[..]).unwrap();
    assert!(state.paused);

    // Test resume
    let resume_accounts = TogglePause {
        bridge_state,
        authority,
    };

    let resume_ix = toggle_pause(program_id, &resume_accounts);
    let resume_result = process_instruction(&resume_ix, &resume_accounts, &[]);
    assert!(resume_result.is_ok());

    let state = BridgeState::try_deserialize(&mut &resume_result.unwrap().data[..]).unwrap();
    assert!(!state.paused);
}

#[test]
fn test_bridge_config_update() {
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

    let state = BridgeState::try_deserialize(&mut &result.unwrap().data[..]).unwrap();
    assert_eq!(state.fee_percentage, fee_percentage);
    assert_eq!(state.fixed_fee, fixed_fee);
    assert_eq!(state.fee_collector, fee_collector);
}

#[test]
fn test_merkle_root_update() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();

    let accounts = UpdateMerkleRoot {
        bridge_state,
        authority,
    };

    let root = [1u8; 32];

    let ix = update_merkle_root(program_id, &accounts, root);
    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());

    let state = BridgeState::try_deserialize(&mut &result.unwrap().data[..]).unwrap();
    assert!(state.merkle_roots.contains(&root));
}

#[test]
fn test_bridge_error_handling() {
    let program_id = id();
    let authority = Pubkey::new_unique();
    let bridge_state = Pubkey::new_unique();
    let sender = Pubkey::new_unique();
    let sender_token_account = Pubkey::new_unique();
    let bridge_vault = Pubkey::new_unique();
    let token_mint = Pubkey::new_unique();
    let token_program = Token::id();

    // Test bridge paused error
    let pause_accounts = TogglePause {
        bridge_state,
        authority,
    };

    let pause_ix = toggle_pause(program_id, &pause_accounts);
    let pause_result = process_instruction(&pause_ix, &pause_accounts, &[]);
    assert!(pause_result.is_ok());

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
    assert!(result.is_err());
    assert_eq!(result.unwrap_err().to_string(), "Bridge is paused");

    // Test insufficient amount error
    let resume_accounts = TogglePause {
        bridge_state,
        authority,
    };

    let resume_ix = toggle_pause(program_id, &resume_accounts);
    let resume_result = process_instruction(&resume_ix, &resume_accounts, &[]);
    assert!(resume_result.is_ok());

    let small_amount = 100; // Less than fixed fee
    let ix = bridge_tokens(
        program_id,
        &accounts,
        small_amount,
        target_chain_id,
        target_address,
        message_hash,
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err().to_string(), "Insufficient amount");
}

#[test]
fn test_message_processing() {
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

    // First claim should succeed
    let ix = claim_tokens(
        program_id,
        &accounts,
        amount,
        source_chain_id,
        message_hash,
        proof.clone(),
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_ok());

    // Second claim with same message hash should fail
    let ix = claim_tokens(
        program_id,
        &accounts,
        amount,
        source_chain_id,
        message_hash,
        proof,
    );

    let result = process_instruction(&ix, &accounts, &[]);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err().to_string(), "Message already processed");
} 