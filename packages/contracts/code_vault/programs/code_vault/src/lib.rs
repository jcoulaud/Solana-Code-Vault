use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod code_vault {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        prize_pool_amount: u64,
        total_supply: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.prize_pool_amount = prize_pool_amount;
        vault.total_supply = total_supply;
        vault.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn send_reward(
        ctx: Context<SendReward>,
        position: u8,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        // Calculate reward based on position
        let reward_amount = calculate_reward(position, vault.prize_pool_amount);

        // Transfer tokens
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.prize_vault.to_account_info(),
                to: ctx.accounts.winner_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, reward_amount)?;

        Ok(())
    }

    pub fn send_dev_allocation(
        ctx: Context<SendDevAllocation>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        // Calculate 2% of total supply
        let dev_amount = vault.total_supply * 2 / 100;

        // Transfer tokens
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.prize_vault.to_account_info(),
                to: ctx.accounts.dev_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, dev_amount)?;

        Ok(())
    }
}

fn calculate_reward(position: u8, prize_pool: u64) -> u64 {
    match position {
        1 => prize_pool / 10,     // 10%
        2 => prize_pool * 7 / 100,  // 7%
        3 => prize_pool * 5 / 100,  // 5%
        4..=10 => prize_pool * 2 / 100,  // 2% each
        11..=30 => prize_pool / 100,  // 1% each
        _ => prize_pool * 63 / 10000,  // 0.63% each
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 8 + 32)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendReward<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub prize_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct SendDevAllocation<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub prize_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub dev_token_account: Account<'info, TokenAccount>,
}

#[account]
pub struct Vault {
    pub prize_pool_amount: u64,
    pub total_supply: u64,
    pub authority: Pubkey,
} 