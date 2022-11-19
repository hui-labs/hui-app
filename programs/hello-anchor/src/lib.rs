mod curve;
mod errors;

use crate::curve::{ConstantProduct, RoundDirection};
use crate::errors::AppError;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Mint, MintTo, TokenAccount, Transfer};

declare_id!("7ncy1ZWKme22jhAusPq1Ltk5AZuFJrJMqHFy2KPeosHz");

#[program]
pub mod hello_anchor {
    use std::ops::Mul;
    use super::*;

    // Decimals is 9
    const SYSTEM_LOAN_FEE: u64 = 1_000_000; // 0.1%
    const SYSTEM_TRANSFER_FEE: u64 = 1_000_000; // 0.1%

    pub fn init_system(ctx: Context<InitSystem>) -> Result<()> {
        Ok(())
    }

    pub fn init_pool(
        ctx: Context<InitPool>,
        config: PoolConfig,
        amount: u64,
        fee_amount: u64,
    ) -> Result<()> {
        let curve = ConstantProduct;
        let required_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        require_gte!(fee_amount + amount, amount + required_fee);

        let pool = &mut ctx.accounts.pool;
        pool.token_a_account = ctx.accounts.token_a_for_pda.key();
        pool.token_b_account = ctx.accounts.token_b_for_pda.key();
        pool.pool_fee_account = ctx.accounts.system_fee_account.key();
        pool.token_a_mint = ctx.accounts.token_a_for_pda.mint.key();
        pool.token_b_mint = ctx.accounts.token_b_for_pda.mint.key();
        pool.fees = Fees {
            loan_fee: SYSTEM_LOAN_FEE,
            transfer_fee: SYSTEM_TRANSFER_FEE
        };
        pool.interest_rate = config.interest_rate;
        pool.max_loan_amount = config.max_loan_amount;
        pool.min_loan_amount = config.min_loan_amount;
        pool.max_loan_threshold = config.max_loan_threshold;

        token::transfer(ctx.accounts.to_transfer_b_context(), amount + fee_amount)?;

        Ok(())
    }

    pub fn estimate_loan_fee(ctx: Context<EstimateFee>, amount: u64) -> Result<u64> {
        Ok((amount * SYSTEM_LOAN_FEE) / 10_u64.pow(9))
    }

    pub fn deposit_all(
        ctx: Context<DepositAll>,
        pool_token_amount: u64,
        maximum_token_a_amount: u64,
        maximum_token_b_amount: u64,
    ) -> Result<()> {
        msg!(
            "Instruction Pool Deposit {},{},{}",
            pool_token_amount,
            maximum_token_a_amount,
            maximum_token_b_amount
        );

        let curve = ConstantProduct;
        let current_pool_mint_supply = to_u128(ctx.accounts.pool.supply)?;
        let (pool_token_amount, pool_mint_supply) = if current_pool_mint_supply > 0 {
            (to_u128(pool_token_amount)?, current_pool_mint_supply)
        } else {
            (curve.new_pool_supply(), curve.new_pool_supply())
        };

        let (token_a_amount, token_b_amount) = curve
            .pool_tokens_to_trading_tokens(
                pool_token_amount,
                pool_mint_supply,
                to_u128(ctx.accounts.token_a_for_pda.amount)?,
                to_u128(ctx.accounts.token_b_for_pda.amount)?,
                RoundDirection::Ceiling,
            )
            .ok_or(AppError::ZeroTradingTokens)?;

        msg!(
            "Pooling token amount of A is {} and B is {}",
            token_a_amount,
            token_b_amount
        );

        let token_a_amount = to_u64(token_a_amount)?;
        if token_a_amount > maximum_token_a_amount {
            return Err(AppError::ExceededSlippage.into());
        }
        if token_a_amount == 0 {
            return Err(AppError::ZeroTradingTokens.into());
        }
        let token_b_amount = to_u64(token_b_amount)?;
        if token_b_amount > maximum_token_b_amount {
            return Err(AppError::ExceededSlippage.into());
        }
        if token_b_amount == 0 {
            return Err(AppError::ZeroTradingTokens.into());
        }

        let signer_seeds = ctx
            .accounts
            .pair
            .signer_seeds(&ctx.accounts.pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];

        token::transfer(ctx.accounts.to_transfer_a_context(), token_a_amount)?;
        token::transfer(ctx.accounts.to_transfer_b_context(), token_b_amount)?;
        token::mint_to(
            ctx.accounts.to_mint_context().with_signer(signer_seeds),
            to_u64(pool_token_amount)?,
        )?;

        Ok(())
    }

    pub fn init_loan(
        ctx: Context<CreateLoan>,
        amount: u64,
    ) -> Result<()> {
        let curve = ConstantProduct;
        let pool = &ctx.accounts.pool;
        ctx.accounts.loan.interest_rate = pool.interest_rate.clone();
        ctx.accounts.loan.borrower = ctx.accounts.borrower.to_account_info().key();
        ctx.accounts.loan.token_a_account = ctx.accounts.pool.token_a_account.clone();
        ctx.accounts.loan.token_b_account = ctx.accounts.pool.token_b_account.clone();
        ctx.accounts.loan.repayment_period = pool.repayment_period.clone();
        ctx.accounts.loan.fees = Fees {
            loan_fee: SYSTEM_LOAN_FEE,
            transfer_fee: SYSTEM_TRANSFER_FEE
        };
        ctx.accounts.loan.min_loan_amount = pool.min_loan_amount.clone();
        ctx.accounts.loan.max_loan_amount = pool.max_loan_amount.clone();
        ctx.accounts.loan.max_loan_threshold = pool.max_loan_threshold.clone();

        let signer_seeds = ctx
            .accounts
            .pool
            .signer_seeds(&ctx.accounts.pool_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        let loan_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        token::transfer(ctx.accounts.to_transfer_a_context(), amount)?;
        token::transfer(
            ctx.accounts
                .to_transfer_fee_context()
                .with_signer(signer_seeds),
            loan_fee,
        )?;
        token::transfer(
            ctx.accounts
                .to_transfer_b_context()
                .with_signer(signer_seeds),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct EstimateFee<'info> {
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct InitSystem<'info> {
    #[account(mut)]
    pub system_fee_account: Box<Account<'info, TokenAccount>>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RepaymentPeriod {
    OneHour,
    OneMonth,
    ThreeMonth,
    SixMonth,
    NineMonth,
    OneYear,
}

#[account]
pub struct Loan {
    pool: Pubkey,
    lender: Pubkey,
    borrower: Pubkey,
    token_a_account: Pubkey,
    token_b_account: Pubkey,
    interest_rate: u64,
    repayment_period: RepaymentPeriod,
    fees: Fees,
    min_loan_amount: u64,
    max_loan_amount: u64,
    max_loan_threshold: u64,
}

#[derive(Accounts)]
pub struct CreateLoan<'info> {
    #[account(zero)]
    pub loan: Box<Account<'info, Loan>>,
    pub pool: Box<Account<'info, Pool>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pool_pda: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_pda: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub token_a_for_pda: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_b_for_pda: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_a_for_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_b_for_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub system_fee_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub borrower: Signer<'info>,
}

impl<'info> CreateLoan<'info> {
    fn to_transfer_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_a_for_depositor.to_account_info().clone(),
            to: self.token_a_for_pda.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn to_transfer_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_b_for_pda.to_account_info().clone(),
            to: self.token_b_for_depositor.to_account_info().clone(),
            authority: self.pool_pda.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn to_transfer_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_b_for_pda.to_account_info().clone(),
            to: self.system_fee_account.to_account_info().clone(),
            authority: self.pool_pda.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(pool_token_amount: u64, maximum_token_a_amount: u64, maximum_token_b_amount: u64)]
pub struct DepositAll<'info> {
    pub depositor: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pda: AccountInfo<'info>,
    #[account(mut)]
    pub pair: Box<Account<'info, Pool>>,
    #[account(mut)]
    pub pool: Account<'info, Mint>,
    #[account(mut)]
    pub token_a_for_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_b_for_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_pool_for_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_a_for_pda: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_b_for_pda: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
}

impl<'info> DepositAll<'info> {
    fn to_transfer_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_a_for_depositor.to_account_info().clone(),
            to: self.token_a_for_pda.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn to_transfer_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_b_for_depositor.to_account_info().clone(),
            to: self.token_b_for_pda.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn to_mint_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.pool.to_account_info().clone(),
            to: self.token_pool_for_depositor.to_account_info().clone(),
            authority: self.pda.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct Fees {
    pub transfer_fee: u64,
    pub loan_fee: u64,
}

pub struct SignerSeeds<'a>([&'a [u8]; 3], [u8; 1]);

impl<'a> SignerSeeds<'a> {
    pub fn value(&self) -> [&[u8]; 4] {
        [self.0[0], self.0[1], self.0[2], &self.1]
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoolConfig {
    pub interest_rate: u64,
    pub repayment_period: RepaymentPeriod,
    pub min_loan_amount: u64,
    pub max_loan_amount: u64,
    pub max_loan_threshold: u64,
}

#[account]
pub struct Pool {
    pub token_a_account: Pubkey,
    pub token_b_account: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub pool_fee_account: Pubkey,
    pub fees: Fees,
    pub interest_rate: u64,
    pub repayment_period: RepaymentPeriod,
    pub min_loan_amount: u64,
    pub max_loan_amount: u64,
    pub max_loan_threshold: u64,
}

impl Pool {
    fn signer_seeds<'a>(&'a self, pda: &AccountInfo, program_id: &Pubkey) -> Result<SignerSeeds> {
        let seeds = [
            b"pool".as_ref(),
            self.token_a_mint.as_ref(),
            self.token_b_mint.as_ref(),
        ];
        let (pubkey, bump) = Pubkey::find_program_address(&seeds, program_id);
        if pubkey != pda.key() {
            return Err(ProgramError::InvalidArgument.into());
        }

        Ok(SignerSeeds(seeds, [bump]))
    }
}

#[derive(Accounts)]
#[instruction(fees: Fees)]
pub struct InitPool<'info> {
    pub depositor: Signer<'info>,
    #[account(zero)]
    pub pool: Box<Account<'info, Pool>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pda: AccountInfo<'info>,
    #[account(mut)]
    pub token_a_for_pda: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_for_pda: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_a_for_depositor: Box<Account<'info, TokenAccount>>,
    pub system_fee_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
}

impl<'info> InitPool<'info> {
    fn to_transfer_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_a_for_depositor.to_account_info().clone(),
            to: self.token_b_for_pda.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

fn to_u128(val: u64) -> Result<u128> {
    val.try_into()
        .map_err(|_| AppError::ConversionFailure.into())
}

fn to_u64(val: u128) -> Result<u64> {
    val.try_into()
        .map_err(|_| AppError::ConversionFailure.into())
}
