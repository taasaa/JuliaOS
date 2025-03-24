use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::hash::Hasher;
use std::collections::HashMap;
use std::convert::TryInto;

declare_id!("65D8Eqy4ZdvDogca13wkDx4yjRnst891YNgWjorSfnT7");

#[program]
pub mod julia_bridge {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let bridge_state = &mut ctx.accounts.bridge_state;
        bridge_state.authority = ctx.accounts.authority.key();
        bridge_state.bump = ctx.bumps.bridge_state;
        bridge_state.paused = false;
        bridge_state.fee_collector = ctx.accounts.authority.key();
        bridge_state.fee_percentage = 25; // 0.25%
        bridge_state.fixed_fee = 1000; // 0.001 SOL
        Ok(())
    }

    pub fn bridge_tokens(
        ctx: Context<BridgeTokens>,
        amount: u64,
        target_chain_id: u64,
        target_address: [u8; 32],
        message_hash: [u8; 32]
    ) -> Result<()> {
        if ctx.accounts.bridge_state.paused {
            return Err(error!(BridgeError::BridgePaused));
        }

        let fee_percentage = ctx.accounts.bridge_state.fee_percentage as u64;
        let fee_amount = (amount * fee_percentage) / 10000;
        let fixed_fee = ctx.accounts.bridge_state.fixed_fee;
        let total_fee = fee_amount + fixed_fee;

        if amount <= total_fee {
            return Err(error!(BridgeError::InsufficientAmount));
        }

        let transfer_amount = amount - total_fee;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sender_token_account.to_account_info(),
                    to: ctx.accounts.bridge_vault.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            transfer_amount,
        )?;

        emit!(BridgeInitiated {
            sender: ctx.accounts.sender.key(),
            token: ctx.accounts.token_mint.key(),
            amount: transfer_amount,
            target_chain_id,
            target_address,
            message_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn claim_tokens(
        ctx: Context<ClaimTokens>,
        amount: u64,
        source_chain_id: u64,
        message_hash: [u8; 32],
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        if ctx.accounts.bridge_state.paused {
            return Err(error!(BridgeError::BridgePaused));
        }

        if ctx.accounts.bridge_state.processed_messages.contains(&message_hash) {
            return Err(error!(BridgeError::MessageAlreadyProcessed));
        }

        let valid_proof = verify_proof(&message_hash, &proof, &ctx.accounts.bridge_state.merkle_roots);
        if !valid_proof {
            return Err(error!(BridgeError::InvalidProof));
        }

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bridge_vault.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.bridge_state.to_account_info(),
                },
                &[&[
                    b"bridge_state".as_ref(),
                    &[ctx.accounts.bridge_state.bump],
                ]],
            ),
            amount,
        )?;

        ctx.accounts.bridge_state.processed_messages.push(message_hash);

        emit!(TokensClaimed {
            recipient: ctx.accounts.recipient.key(),
            token: ctx.accounts.token_mint.key(),
            amount,
            source_chain_id,
            message_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_bridge_config(
        ctx: Context<UpdateBridgeConfig>,
        fee_percentage: u16,
        fixed_fee: u64,
        fee_collector: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.authority.key() == ctx.accounts.bridge_state.authority, BridgeError::Unauthorized);
        require!(fee_percentage <= 1000, BridgeError::InvalidFeePercentage); // Max 10%

        let bridge_state = &mut ctx.accounts.bridge_state;
        bridge_state.fee_percentage = fee_percentage;
        bridge_state.fixed_fee = fixed_fee;
        bridge_state.fee_collector = fee_collector;
        Ok(())
    }

    pub fn toggle_pause(ctx: Context<TogglePause>) -> Result<()> {
        require!(ctx.accounts.authority.key() == ctx.accounts.bridge_state.authority, BridgeError::Unauthorized);
        ctx.accounts.bridge_state.paused = !ctx.accounts.bridge_state.paused;
        Ok(())
    }

    pub fn update_merkle_root(
        ctx: Context<UpdateMerkleRoot>,
        root: [u8; 32],
    ) -> Result<()> {
        require!(ctx.accounts.authority.key() == ctx.accounts.bridge_state.authority, BridgeError::Unauthorized);
        
        let bridge_state = &mut ctx.accounts.bridge_state;
        bridge_state.merkle_roots.push(root);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = BridgeState::LEN,
        seeds = [b"bridge_state"],
        bump
    )]
    pub bridge_state: Account<'info, BridgeState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BridgeTokens<'info> {
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(mut)]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bridge_vault: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
    
    #[account(mut)]
    pub recipient: Signer<'info>,
    
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bridge_vault: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateBridgeConfig<'info> {
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TogglePause<'info> {
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMerkleRoot<'info> {
    #[account(mut)]
    pub bridge_state: Account<'info, BridgeState>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct BridgeState {
    pub authority: Pubkey,
    pub bump: u8,
    pub paused: bool,
    pub fee_collector: Pubkey,
    pub fee_percentage: u16,
    pub fixed_fee: u64,
    pub processed_messages: Vec<[u8; 32]>,
    pub merkle_roots: Vec<[u8; 32]>,
}

impl BridgeState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        1 + // bump
        1 + // paused
        32 + // fee_collector
        2 + // fee_percentage
        8 + // fixed_fee
        4 + // processed_messages length
        (32 * 1000) + // processed_messages (max 1000 messages)
        4 + // merkle_roots length
        (32 * 100); // merkle_roots (max 100 roots)
}

#[event]
pub struct BridgeInitiated {
    pub sender: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub target_chain_id: u64,
    pub target_address: [u8; 32],
    pub message_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct TokensClaimed {
    pub recipient: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub source_chain_id: u64,
    pub message_hash: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum BridgeError {
    #[msg("Bridge is paused")]
    BridgePaused,
    
    #[msg("Message already processed")]
    MessageAlreadyProcessed,
    
    #[msg("Invalid proof")]
    InvalidProof,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Invalid fee percentage")]
    InvalidFeePercentage,
    
    #[msg("Insufficient amount")]
    InsufficientAmount,
}

fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Hasher::default();
    hasher.hash(left);
    hasher.hash(right);
    hasher.result().to_bytes()
}

fn verify_merkle_proof(
    leaf: &[u8; 32],
    proof: &[[u8; 32]],
    root: &[u8; 32]
) -> bool {
    let mut current = *leaf;
    
    for sibling in proof.iter() {
        if current < *sibling {
            current = hash_pair(&current, sibling);
        } else {
            current = hash_pair(sibling, &current);
        }
    }
    
    current == *root
}

fn verify_message_proof(message_hash: [u8; 32], proof: &[[u8; 32]], state: &BridgeState) -> bool {
    // Check if any merkle root in the state matches the proof
    for root in state.merkle_roots.iter() {
        if verify_merkle_proof(&message_hash, proof, root) {
            return true;
        }
    }
    false
}

fn verify_proof(message_hash: &[u8; 32], proof: &[[u8; 32]], roots: &[[u8; 32]]) -> bool {
    if proof.is_empty() || roots.is_empty() {
        return false;
    }
    
    // Calculate the root from the message hash and the proof
    let mut current_hash = *message_hash;
    for proof_element in proof {
        current_hash = hash_pair(&current_hash, proof_element);
    }
    
    // Check if the calculated root exists in the merkle roots
    for root in roots {
        if &current_hash == root {
            return true;
        }
    }
    
    false
}
