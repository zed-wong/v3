use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("DijcrEqNwGBDr1PfbxNDpwiRSc86RA339czMbqGtoUjY");

#[program]
pub mod instance_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, registration_fee: u64) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.admin = ctx.accounts.admin.key();
        registry.registration_fee = registration_fee;
        registry.total_instances = 0;
        registry.bump = ctx.bumps.registry;
        Ok(())
    }

    pub fn register_instance(
        ctx: Context<RegisterInstance>,
        instance_id: [u8; 32],
        endpoint: String,
    ) -> Result<()> {
        require!(endpoint.len() <= 200, RegistryError::EndpointTooLong);

        let registry = &ctx.accounts.registry;
        let clock = Clock::get()?;

        // Check rate limit
        let rate_limit = &mut ctx.accounts.rate_limit;
        if rate_limit.last_registration > 0 {
            require!(
                clock.unix_timestamp - rate_limit.last_registration >= 60,
                RegistryError::RateLimitExceeded
            );
        }

        // Collect registration fee
        let fee_transfer = system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.registry.to_account_info(),
        };
        let fee_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            fee_transfer,
        );
        system_program::transfer(fee_ctx, registry.registration_fee)?;

        // Create instance record
        let instance = &mut ctx.accounts.instance;
        instance.instance_id = instance_id;
        instance.authority = ctx.accounts.authority.key();
        instance.endpoint = endpoint;
        instance.registered_at = clock.unix_timestamp;
        instance.last_heartbeat = clock.unix_timestamp;
        instance.is_active = true;
        instance.bump = ctx.bumps.instance;

        // Update rate limit
        rate_limit.authority = ctx.accounts.authority.key();
        rate_limit.last_registration = clock.unix_timestamp;
        rate_limit.registration_count += 1;
        rate_limit.bump = ctx.bumps.rate_limit;

        // Update registry stats
        ctx.accounts.registry.total_instances += 1;

        emit!(InstanceRegistered {
            instance_id,
            authority: ctx.accounts.authority.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_heartbeat(ctx: Context<UpdateHeartbeat>) -> Result<()> {
        let clock = Clock::get()?;
        let instance = &mut ctx.accounts.instance;
        
        require!(instance.is_active, RegistryError::InstanceNotActive);
        require!(
            ctx.accounts.authority.key() == instance.authority,
            RegistryError::UnauthorizedAccess
        );

        instance.last_heartbeat = clock.unix_timestamp;

        Ok(())
    }

    pub fn deactivate_instance(ctx: Context<DeactivateInstance>) -> Result<()> {
        let instance = &mut ctx.accounts.instance;
        
        require!(
            ctx.accounts.authority.key() == instance.authority,
            RegistryError::UnauthorizedAccess
        );

        instance.is_active = false;

        emit!(InstanceDeactivated {
            instance_id: instance.instance_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_registration_fee(ctx: Context<UpdateRegistry>, new_fee: u64) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.registration_fee = new_fee;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + RegistryConfig::INIT_SPACE,
        seeds = [b"registry_config"],
        bump
    )]
    pub registry: Account<'info, RegistryConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(instance_id: [u8; 32])]
pub struct RegisterInstance<'info> {
    #[account(
        mut,
        seeds = [b"registry_config"],
        bump = registry.bump
    )]
    pub registry: Account<'info, RegistryConfig>,
    #[account(
        init,
        payer = authority,
        space = 8 + InstanceRecord::INIT_SPACE,
        seeds = [b"instance", instance_id.as_ref()],
        bump
    )]
    pub instance: Account<'info, InstanceRecord>,
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + RateLimitAccount::INIT_SPACE,
        seeds = [b"rate_limit", authority.key().as_ref()],
        bump
    )]
    pub rate_limit: Account<'info, RateLimitAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateHeartbeat<'info> {
    #[account(
        mut,
        seeds = [b"instance", instance.instance_id.as_ref()],
        bump = instance.bump
    )]
    pub instance: Account<'info, InstanceRecord>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateInstance<'info> {
    #[account(
        mut,
        seeds = [b"instance", instance.instance_id.as_ref()],
        bump = instance.bump
    )]
    pub instance: Account<'info, InstanceRecord>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateRegistry<'info> {
    #[account(
        mut,
        seeds = [b"registry_config"],
        bump = registry.bump,
        constraint = registry.admin == admin.key() @ RegistryError::UnauthorizedAccess
    )]
    pub registry: Account<'info, RegistryConfig>,
    pub admin: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct RegistryConfig {
    pub admin: Pubkey,
    pub registration_fee: u64,
    pub total_instances: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InstanceRecord {
    pub instance_id: [u8; 32],
    pub authority: Pubkey,
    #[max_len(200)]
    pub endpoint: String,
    pub registered_at: i64,
    pub last_heartbeat: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RateLimitAccount {
    pub authority: Pubkey,
    pub last_registration: i64,
    pub registration_count: u32,
    pub bump: u8,
}

#[event]
pub struct InstanceRegistered {
    pub instance_id: [u8; 32],
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct InstanceDeactivated {
    pub instance_id: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum RegistryError {
    #[msg("Rate limit exceeded. Please wait before registering another instance.")]
    RateLimitExceeded,
    #[msg("Endpoint string is too long (max 200 characters).")]
    EndpointTooLong,
    #[msg("Instance is not active.")]
    InstanceNotActive,
    #[msg("Unauthorized access.")]
    UnauthorizedAccess,
}
