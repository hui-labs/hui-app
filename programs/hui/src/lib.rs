use anchor_lang::AccountsClose;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Burn, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::curve::{ConstantProduct, LoanTerm};
use crate::curve::to_u64;

mod curve;
mod errors;

declare_id!("7syDmCTM9ap9zhfH1gwjDJcGD6LyGFGcggh4fsKxzovV");

#[program]
pub mod hui {
    use super::*;

    // 0.1%
    const SYSTEM_LOAN_FEE: u64 = 1_000_000;
    // 0.1%
    const SYSTEM_TRANSFER_FEE: u64 = 1_000_000;

    // pub fn init_hui(ctx: Context<InitHui>) -> Result<()> {
    //     let hui = &mut ctx.accounts.hui;
    //     hui.loan_fee = 1_000_000;
    //     hui.transfer_fee = 1_000_000;
    //
    //     Ok(())
    // }

    pub fn init_pool(
        ctx: Context<InitPool>,
        config: PoolConfig,
        amount: u64,
        fee: u64,
    ) -> Result<()> {
        let curve = ConstantProduct;
        let required_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        require!(amount != 0, AppError::AmountIsZero);
        require!(fee == required_fee, AppError::FeeNotEnough);

        let pool = &mut ctx.accounts.pool;
        pool.vault_account = ctx.accounts.vault_account.key();
        pool.vault_mint = ctx.accounts.vault_account.mint.key();
        pool.collateral_mint = ctx.accounts.collateral_mint.key();
        pool.pool_fee_account = ctx.accounts.system_fee_account.key();
        pool.fees = Fees {
            loan_fee: SYSTEM_LOAN_FEE,
            transfer_fee: SYSTEM_TRANSFER_FEE,
        };
        pool.interest_rate = config.interest_rate;
        pool.max_loan_amount = config.max_loan_amount;
        pool.min_loan_amount = config.min_loan_amount;
        pool.max_loan_threshold = config.max_loan_threshold;
        pool.status = PoolStatus::Opening;
        pool.owner = ctx.accounts.depositor.key();

        let total = amount + required_fee;
        token::transfer(ctx.accounts.to_transfer_vault_context(), total)?;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, fee: u64) -> Result<()> {
        let curve = ConstantProduct;
        let required_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        require!(amount != 0, AppError::AmountIsZero);
        require!(fee >= required_fee, AppError::FeeNotEnough);

        let total = amount + required_fee;
        token::transfer(ctx.accounts.to_transfer_vault_ctx(), total)?;

        Ok(())
    }

    pub fn init_loan(ctx: Context<InitLoan>, amount: u64, loan_term: LoanTerm) -> Result<()> {
        let curve = ConstantProduct;
        let pool = &ctx.accounts.pool;
        let master_loan = &mut ctx.accounts.master_loan;

        master_loan.interest_rate = pool.interest_rate.clone();
        master_loan.pool = pool.to_account_info().key().clone();
        master_loan.owner = ctx.accounts.loan_pda.key().clone();
        master_loan.is_claimed = false;
        master_loan.creator = ctx.accounts.pool.owner.key().clone();
        master_loan.borrower = ctx.accounts.borrower.to_account_info().key();
        master_loan.vault_account = ctx.accounts.vault_account.key().clone();
        master_loan.vault_mint = ctx.accounts.vault_mint.key().clone();
        master_loan.collateral_account = ctx.accounts.collateral_account.key().clone();
        master_loan.collateral_mint = ctx.accounts.collateral_mint.key().clone();
        master_loan.loan_term = loan_term;
        master_loan.fees = Fees {
            loan_fee: SYSTEM_LOAN_FEE,
            transfer_fee: SYSTEM_TRANSFER_FEE,
        };
        master_loan.min_loan_amount = pool.min_loan_amount.clone();
        master_loan.max_loan_amount = pool.max_loan_amount.clone();
        master_loan.max_loan_threshold = pool.max_loan_threshold.clone();
        master_loan.status = LoanStatus::Opening;

        // Transfer to the borrower
        // amount >= min_loan
        // && amount <= current_pool_amount - loan_fee
        // && amount <= max_loan
        let required_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        let received_amount = curve.calc_max_loan_amount(pool.max_loan_threshold, amount)?;
        let pool_vault_amount = ctx.accounts.pool_vault.amount;
        require!(amount >= pool.min_loan_amount, AppError::AmountTooSmall);
        require!(amount <= pool.max_loan_amount, AppError::AmountTooLarge);
        require!(
            pool_vault_amount - required_fee >= amount,
            AppError::PoolAmountNotEnough
        );

        master_loan.received_amount = received_amount;
        master_loan.fee = required_fee;

        let signer_seeds = ctx
            .accounts
            .pool
            .signer_seeds(&ctx.accounts.pool_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];

        token::transfer(ctx.accounts.to_transfer_vault_context(), amount)?;
        token::transfer(
            ctx.accounts
                .to_transfer_fee_context()
                .with_signer(signer_seeds),
            required_fee,
        )?;
        token::transfer(
            ctx.accounts
                .to_transfer_receiver_context()
                .with_signer(signer_seeds),
            received_amount,
        )?;

        // Mint NFT
        let signer_seeds = ctx
            .accounts
            .master_loan
            .signer_seeds(&ctx.accounts.loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        token::mint_to(
            ctx.accounts.to_mint_nft_context().with_signer(signer_seeds),
            1,
        )?;

        Ok(())
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let data_account = &ctx.accounts.pool;
        let owner_info = ctx.accounts.owner.to_account_info();
        data_account.close(owner_info)?;
        // let data_account_info: &AccountInfo = data_account.as_ref();
        // require_keys_eq!(*data_account_info.owner, System::id());

        Ok(())
    }

    // Only for testing
    pub fn close_loan(ctx: Context<CloseLoan>) -> Result<()> {
        let data_account = &ctx.accounts.loan;
        let owner_info = ctx.accounts.owner.to_account_info();
        data_account.close(owner_info)?;
        // let data_account_info: &AccountInfo = data_account.as_ref();
        // require_keys_eq!(*data_account_info.owner, System::id());

        Ok(())
    }

    pub fn claim_nft(ctx: Context<ClaimNft>) -> Result<()> {
        let master_loan = &mut ctx.accounts.master_loan;
        require!(!master_loan.is_claimed, AppError::NftAlreadyClaimed);
        master_loan.is_claimed = true;

        let loan_metadata = &mut ctx.accounts.loan_metadata;
        loan_metadata.parent = ctx.accounts.master_loan.key().clone();
        loan_metadata.amount = ctx.accounts.master_loan.received_amount;
        let clock = Clock::get().unwrap();
        loan_metadata.created_at = clock.unix_timestamp;
        loan_metadata.account = ctx.accounts.nft_account.key().clone();
        loan_metadata.mint = ctx.accounts.nft_account.mint.key().clone();
        loan_metadata.is_claimed = false;

        let signer_seeds = ctx
            .accounts
            .master_loan
            .signer_seeds(&ctx.accounts.master_loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        token::transfer(
            ctx.accounts
                .to_transfer_nft_context()
                .with_signer(signer_seeds),
            1,
        )?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let remain_amount = ctx.accounts.pool_vault.amount;
        require_gt!(remain_amount, 0);
        require_gte!(remain_amount, amount);

        let signer_seeds = ctx
            .accounts
            .pool
            .signer_seeds(&ctx.accounts.pool_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];

        token::transfer(
            ctx.accounts
                .to_transfer_a_context()
                .with_signer(signer_seeds),
            amount,
        )?;

        Ok(())
    }

    pub fn final_settlement(ctx: Context<FinalSettlement>, amount: u64) -> Result<()> {
        let required_amount = ctx.accounts.loan.received_amount;
        let curve = ConstantProduct;
        let interest_amount = to_u64(curve.calc_interest_amount(
            ctx.accounts.loan.received_amount,
            ctx.accounts.loan.interest_rate,
            ctx.accounts.loan.loan_term.clone(),
        )?)?;
        require_gte!(amount, required_amount + interest_amount);
        let signer_seeds = ctx
            .accounts
            .loan
            .signer_seeds(&ctx.accounts.loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];

        token::transfer(ctx.accounts.to_transfer_vault_context(), amount)?;
        token::transfer(
            ctx.accounts
                .to_transfer_receiver_context()
                .with_signer(signer_seeds),
            ctx.accounts.collateral_account.amount,
        )?;
        ctx.accounts.loan.status = LoanStatus::Done;

        Ok(())
    }

    pub fn claim_loan(ctx: Context<ClaimLoan>) -> Result<()> {
        let loan_metadata = &mut ctx.accounts.loan_metadata;
        loan_metadata.is_claimed = true;

        let signer_seeds = ctx
            .accounts
            .master_loan
            .signer_seeds(&ctx.accounts.master_loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        let loan_amount = ctx.accounts.loan_metadata.amount;
        token::transfer(
            ctx.accounts
                .to_transfer_receiver_context()
                .with_signer(signer_seeds),
            loan_amount,
        )?;
        // token::close_account(ctx.accounts.to_close_nft_context())?;
        token::burn(ctx.accounts.to_burn_nft_context(), 1)?;
        ctx.accounts.master_loan.status = LoanStatus::Closed;

        Ok(())
    }

    pub fn split_loan(ctx: Context<SplitLoan>, number: u64) -> Result<()> {
        let splitted_amount = ctx.accounts.loan_metadata.amount / number;
        for account in ctx.remaining_accounts.iter() {
            let mut a: Account<LoanMetadata> = Account::try_from(account)?;
            a.amount = splitted_amount;
        }

        Ok(())
    }
}

#[error_code]
pub enum AppError {
    #[msg("Signer is not nft owner")]
    SignerIsNotNftOwner,
    #[msg("Pool amount is not enough")]
    PoolAmountNotEnough,
    #[msg("Provided amount is too large")]
    AmountTooLarge,
    #[msg("Provided amount is too small")]
    AmountTooSmall,
    #[msg("Provided amount is zero")]
    AmountIsZero,
    #[msg("Provided fee is invalid")]
    FeeNotEnough,
    #[msg("NFT has already claimed")]
    NftAlreadyClaimed,
}

// const DISCRIMINATOR_SIZE: usize = 8;
//
// #[account]
// pub struct Hui {
//     loan_fee: u64,
//     transfer_fee: u64,
// }
//
// impl Hui {
//     pub const MAX_SIZE: usize = DISCRIMINATOR_SIZE + 8 + 8;
// }
//
// #[derive(Accounts)]
// pub struct InitHui<'info> {
//     #[account(init, payer = owner, space = Hui::MAX_SIZE)]
//     hui: Account<'info, Hui>,
//     owner: Signer<'info>,
// }

#[derive(Accounts)]
pub struct CloseLoan<'info> {
    #[account(mut, close = owner)]
    pub loan: Account<'info, MasterLoan>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(mut, close = owner)]
    pub pool: Account<'info, Pool>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub owner: AccountInfo<'info>,
}

#[account]
pub struct LoanMetadata {
    pub parent: Pubkey,
    pub amount: u64,
    pub account: Pubkey,
    pub mint: Pubkey,
    pub is_claimed: bool,
    pub created_at: i64,
}

#[derive(Accounts)]
pub struct ClaimNft<'info> {
    pub master_loan: Box<Account<'info, MasterLoan>>,
    #[account(zero)]
    pub loan_metadata: Box<Account<'info, LoanMetadata>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_metadata_pda: AccountInfo<'info>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub nft_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = token_account.owner == master_loan.creator)]
    pub token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub master_loan_pda: AccountInfo<'info>,
}

impl<'info> ClaimNft<'info> {
    fn to_transfer_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.nft_account.to_account_info().clone(),
            to: self.token_account.to_account_info().clone(),
            authority: self.master_loan_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct SplitLoan<'info> {
    // pub owner: Signer<'info>,
    // pub master_loan: Box<Account<'info, MasterLoan>>,
    pub loan_metadata: Box<Account<'info, LoanMetadata>>,
    // /// CHECK: This is not dangerous because we don't read or write from this account
    // pub loan_metadata_pda: AccountInfo<'info>,
    // pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimLoan<'info> {
    pub owner: Signer<'info>,
    pub master_loan: Box<Account<'info, MasterLoan>>,
    #[account(mut, constraint = loan_metadata.parent == master_loan.key())]
    pub loan_metadata: Box<Account<'info, LoanMetadata>>,
    #[account(mut)]
    pub nft_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_destination: UncheckedAccount<'info>,
    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, constraint = nft_mint.key() == loan_metadata.mint)]
    pub nft_mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub vault_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub master_loan_pda: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> ClaimLoan<'info> {
    fn to_transfer_receiver_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.token_account.to_account_info().clone(),
            authority: self.master_loan_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn to_burn_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.nft_mint.to_account_info().clone(),
            from: self.nft_account.to_account_info().clone(),
            authority: self.owner.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct FinalSettlement<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub loan: Box<Account<'info, MasterLoan>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_pda: AccountInfo<'info>,
    #[account(mut)]
    pub collateral_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_receiver: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

impl<'info> FinalSettlement<'info> {
    fn to_transfer_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_depositor.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn to_transfer_receiver_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.collateral_account.to_account_info().clone(),
            to: self.token_receiver.to_account_info().clone(),
            authority: self.loan_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pool_pda: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Withdraw<'info> {
    fn to_transfer_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.pool_vault.to_account_info().clone(),
            to: self.token_depositor.to_account_info().clone(),
            authority: self.pool_pda.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

pub struct SignerSeeds<'a, const N: usize>([&'a [u8]; N], [u8; 1]);

impl<'a> SignerSeeds<'a, 2> {
    pub fn value(&self) -> [&[u8]; 3] {
        [self.0[0], self.0[1], &self.1]
    }
}

impl<'a> SignerSeeds<'a, 3> {
    pub fn value(&self) -> [&[u8]; 4] {
        [self.0[0], self.0[1], self.0[2], &self.1]
    }
}

impl<'a> SignerSeeds<'a, 4> {
    pub fn value(&self) -> [&[u8]; 5] {
        [self.0[0], self.0[1], self.0[2], self.0[3], &self.1]
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LoanStatus {
    Opening,
    Disabled,
    Closed,
    Done,
}

#[account]
pub struct MasterLoan {
    pool: Pubkey,
    owner: Pubkey,
    creator: Pubkey,
    is_claimed: bool,
    borrower: Pubkey,
    collateral_mint: Pubkey,
    collateral_account: Pubkey,
    vault_account: Pubkey,
    vault_mint: Pubkey,
    interest_rate: u64,
    loan_term: LoanTerm,
    fees: Fees,
    min_loan_amount: u64,
    max_loan_amount: u64,
    max_loan_threshold: u64,
    fee: u64,
    received_amount: u64,
    status: LoanStatus,
}

impl MasterLoan {
    fn signer_seeds<'a>(
        &'a self,
        pda: &AccountInfo,
        program_id: &Pubkey,
    ) -> Result<SignerSeeds<2>> {
        let seeds = [b"masterLoan".as_ref(), self.pool.as_ref()];
        let (pubkey, bump) = Pubkey::find_program_address(&seeds, program_id);
        if pubkey != pda.key() {
            return Err(ProgramError::InvalidArgument.into());
        }

        Ok(SignerSeeds::<2>(
            seeds,
            [bump],
        ))
    }
}

#[derive(Accounts)]
pub struct InitLoan<'info> {
    #[account(zero)]
    pub master_loan: Box<Account<'info, MasterLoan>>,
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pool_pda: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_pda: AccountInfo<'info>,

    #[account(mut)]
    pub pool_vault: Box<Account<'info, TokenAccount>>,

    pub vault_mint: Box<Account<'info, Mint>>,
    #[account(init, payer = borrower, token::mint = vault_mint, token::authority = loan_pda)]
    pub vault_account: Box<Account<'info, TokenAccount>>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    #[account(init, payer = borrower, token::mint = collateral_mint, token::authority = loan_pda)]
    pub collateral_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_receiver: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub system_fee_account: Box<Account<'info, TokenAccount>>,

    #[account(init, payer = borrower, mint::decimals = 0, mint::authority = loan_pda)]
    pub nft_mint: Box<Account<'info, Mint>>,
    #[account(init, payer = borrower, token::mint = nft_mint, token::authority = loan_pda)]
    pub nft_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub borrower: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitLoan<'info> {
    fn to_mint_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.nft_mint.to_account_info().clone(),
            to: self.nft_account.to_account_info().clone(),
            authority: self.loan_pda.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn to_transfer_receiver_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.pool_vault.to_account_info().clone(),
            to: self.token_receiver.to_account_info().clone(),
            authority: self.pool_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn to_transfer_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_depositor.to_account_info().clone(),
            to: self.collateral_account.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn to_transfer_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.pool_vault.to_account_info().clone(),
            to: self.system_fee_account.to_account_info().clone(),
            authority: self.pool_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub pool: Box<Account<'info, Pool>>,
    #[account(mut, constraint = token_depositor.owner == depositor.key())]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub loan_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Deposit<'info> {
    fn to_transfer_vault_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_depositor.to_account_info().clone(),
            to: self.loan_vault.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct Fees {
    pub transfer_fee: u64,
    pub loan_fee: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoolConfig {
    pub interest_rate: u64,
    pub min_loan_amount: u64,
    pub max_loan_amount: u64,
    pub max_loan_threshold: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PoolStatus {
    Opening,
    Disabled,
    Closed,
}

#[account]
pub struct Pool {
    pub owner: Pubkey,
    pub vault_account: Pubkey,
    pub vault_mint: Pubkey,
    pub collateral_mint: Pubkey,
    pub pool_fee_account: Pubkey,
    pub fees: Fees,
    pub interest_rate: u64,
    pub min_loan_amount: u64,
    pub max_loan_amount: u64,
    pub max_loan_threshold: u64,
    pub status: PoolStatus,
}

impl Pool {
    fn signer_seeds<'a>(
        &'a self,
        pda: &AccountInfo,
        program_id: &Pubkey,
    ) -> Result<SignerSeeds<4>> {
        let seeds = [
            b"pool".as_ref(),
            self.owner.as_ref(),
            self.collateral_mint.as_ref(),
            self.vault_mint.as_ref(),
        ];
        let (pubkey, bump) = Pubkey::find_program_address(&seeds, program_id);
        if pubkey != pda.key() {
            return Err(ProgramError::InvalidArgument.into());
        }

        Ok(SignerSeeds::<4>(seeds, [bump]))
    }
}

#[derive(Accounts)]
pub struct InitPool<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(zero)]
    pub pool: Box<Account<'info, Pool>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub pda: AccountInfo<'info>,
    #[account(init, payer = depositor, token::mint = vault_mint, token::authority = pda)]
    pub vault_account: Box<Account<'info, TokenAccount>>,
    pub vault_mint: Box<Account<'info, Mint>>,
    pub collateral_mint: Box<Account<'info, Mint>>,
    #[account(mut, constraint = token_depositor.mint == vault_mint.key())]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    pub system_fee_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitPool<'info> {
    fn to_transfer_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_depositor.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.depositor.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}
