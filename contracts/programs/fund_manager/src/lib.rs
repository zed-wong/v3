use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("FundManager11111111111111111111111111111111");

#[program]
pub mod fund_manager {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let fund_account = &mut ctx.accounts.fund_account;
        fund_account.admin = admin;
        fund_account.total_funds = 0;
        fund_account.bump = ctx.bumps.fund_account;
        Ok(())
    }

    pub fn store_funds(ctx: Context<StoreFunds>, amount: u64) -> Result<()> {
        let fund_account = &mut ctx.accounts.fund_account;
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from_token_account.to_account_info(),
                    to: ctx.accounts.fund_token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        fund_account.total_funds = fund_account.total_funds.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn allocate_funds(ctx: Context<AllocateFunds>, amount: u64, _recipient: Pubkey) -> Result<()> {
        let fund_account = &mut ctx.accounts.fund_account;
        
        require!(
            ctx.accounts.admin.key() == fund_account.admin,
            FundError::UnauthorizedAdmin
        );
        
        require!(
            fund_account.total_funds >= amount,
            FundError::InsufficientFunds
        );

        let seeds = &[
            b"fund_account".as_ref(),
            &[fund_account.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.fund_token_account.to_account_info(),
                    to: ctx.accounts.to_token_account.to_account_info(),
                    authority: fund_account.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        fund_account.total_funds = fund_account.total_funds.checked_sub(amount).unwrap();
        Ok(())
    }

    pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
        let fund_account = &mut ctx.accounts.fund_account;
        
        require!(
            ctx.accounts.current_admin.key() == fund_account.admin,
            FundError::UnauthorizedAdmin
        );

        fund_account.admin = new_admin;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + FundAccount::INIT_SPACE,
        seeds = [b"fund_account"],
        bump
    )]
    pub fund_account: Account<'info, FundAccount>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StoreFunds<'info> {
    #[account(mut)]
    pub fund_account: Account<'info, FundAccount>,
    
    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fund_token_account: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AllocateFunds<'info> {
    #[account(mut)]
    pub fund_account: Account<'info, FundAccount>,
    
    #[account(mut)]
    pub fund_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,
    
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetAdmin<'info> {
    #[account(mut)]
    pub fund_account: Account<'info, FundAccount>,
    
    pub current_admin: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct FundAccount {
    pub admin: Pubkey,
    pub total_funds: u64,
    pub bump: u8,
}

#[error_code]
pub enum FundError {
    #[msg("Unauthorized admin access")]
    UnauthorizedAdmin,
    #[msg("Insufficient funds for allocation")]
    InsufficientFunds,
}