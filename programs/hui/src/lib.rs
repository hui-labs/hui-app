mod curve;
mod errors;

use crate::curve::{ConstantProduct, LoanTerm};
use crate::errors::AppError;
use anchor_lang::prelude::*;
use anchor_spl::{token, mint};
use anchor_spl::token::{Burn, CloseAccount, Mint, MintTo, Token, TokenAccount, Transfer, InitializeAccount};

declare_id!("7ncy1ZWKme22jhAusPq1Ltk5AZuFJrJMqHFy2KPeosHz");

#[program]
pub mod hui {
    use super::*;
    use crate::curve::to_u64;
    use mpl_token_metadata::instruction::{
        create_metadata_accounts_v2, create_metadata_accounts_v3,
    };
    use spl_token::solana_program::program::{invoke, invoke_signed};

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

        token::transfer(
            ctx.accounts.to_transfer_vault_context(),
            amount + fee_amount,
        )?;

        Ok(())
    }

    pub fn estimate_loan_fee(ctx: Context<EstimateFee>, amount: u64) -> Result<u64> {
        let curve = ConstantProduct;
        Ok(curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount))
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, fee: u64) -> Result<()> {
        let curve = ConstantProduct;
        let loan_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        require_gte!(amount, 0);
        require_gte!(fee, loan_fee);

        token::transfer(ctx.accounts.to_transfer_a_context(), amount + fee)?;

        Ok(())
    }

    pub fn init_loan(ctx: Context<InitLoan>, amount: u64, loan_term: LoanTerm) -> Result<()> {
        let curve = ConstantProduct;
        let pool = &ctx.accounts.pool;
        let loan = &mut ctx.accounts.loan;

        loan.interest_rate = pool.interest_rate.clone();
        loan.pool = pool.to_account_info().key().clone();
        loan.owner = ctx.accounts.nft_account.key().clone();
        loan.borrower = ctx.accounts.borrower.to_account_info().key();

        loan.vault_account = ctx.accounts.vault_account.key().clone();
        loan.vault_mint = ctx.accounts.vault_mint.key().clone();
        loan.collateral_account = ctx.accounts.collateral_account.key().clone();
        loan.collateral_mint = ctx.accounts.collateral_mint.key().clone();

        loan.loan_term = loan_term;
        loan.fees = Fees {
            loan_fee: SYSTEM_LOAN_FEE,
            transfer_fee: SYSTEM_TRANSFER_FEE,
        };
        loan.min_loan_amount = pool.min_loan_amount.clone();
        loan.max_loan_amount = pool.max_loan_amount.clone();
        loan.max_loan_threshold = pool.max_loan_threshold.clone();
        loan.status = LoanStatus::Opening;

        let signer_seeds = ctx
            .accounts
            .pool
            .signer_seeds(&ctx.accounts.pool_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];

        // Transfer to the borrower
        // amount >= min_loan
        // && amount <= current_pool_amount - loan_fee
        // && amount <= max_loan
        let loan_fee = curve.calc_loan_fee(SYSTEM_LOAN_FEE, amount);
        let token_a_amount = ctx.accounts.pool_vault.amount;
        // require_gte!(amount, pool.min_loan_amount);
        // require_gte!(pool.max_loan_amount, amount);
        let received_amount = curve.calc_max_loan_amount(pool.max_loan_threshold, amount);
        // require_gte!(token_a_amount - loan_fee, max_return_amount);

        loan.received_amount = received_amount;
        loan.fee = loan_fee;

        token::transfer(ctx.accounts.to_transfer_vault_context(), amount)?;
        token::transfer(
            ctx.accounts
                .to_transfer_fee_context()
                .with_signer(signer_seeds),
            loan_fee,
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
            .loan
            .signer_seeds(&ctx.accounts.loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        token::mint_to(ctx.accounts.to_mint_nft_context().with_signer(signer_seeds), 1)?;

        // let account_info = vec![
        //     ctx.accounts.metadata.to_account_info(),
        //     ctx.accounts.mint_nft.to_account_info(),
        //     ctx.accounts.borrower.to_account_info(), // mint_authority
        //     ctx.accounts.borrower.to_account_info(),
        //     ctx.accounts.token_metadata_program.to_account_info(),
        //     ctx.accounts.token_program.to_account_info(),
        //     ctx.accounts.system_program.to_account_info(),
        //     ctx.accounts.rent.to_account_info(),
        // ];
        // let creator = vec![
        //     mpl_token_metadata::state::Creator {
        //         address: ctx.accounts.borrower.key(),
        //         verified: false,
        //         share: 100,
        //     }
        // ];
        // invoke_signed(
        //     &create_metadata_accounts_v3(
        //         ctx.accounts.token_metadata_program.key(),
        //         ctx.accounts.metadata.key(),
        //         ctx.accounts.mint_nft.key(),
        //         ctx.accounts.borrower.key(),
        //         ctx.accounts.borrower.key(),
        //         ctx.accounts.borrower.key(),
        //         "LOAN 1".to_string(),
        //         "LOAN".to_string(),
        //         "".to_string(),
        //         Some(creator),
        //         1,
        //         true,
        //         false,
        //         None,
        //         None,
        //         None,
        //     ),
        //     account_info.as_slice(),
        //     signer_seeds
        // )?;

        Ok(())
    }

    pub fn claim_nft(ctx: Context<ClaimNft>) -> Result<()> {
        let signer_seeds = ctx
            .accounts
            .loan
            .signer_seeds(&ctx.accounts.loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        token::transfer(ctx.accounts.to_transfer_nft_context().with_signer(signer_seeds), 1)?;

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

    pub fn settlement_amount(ctx: Context<SettlementAmount>) -> Result<u128> {
        let curve = ConstantProduct;
        let interest_amount = curve.calc_interest_amount(
            ctx.accounts.loan.received_amount,
            ctx.accounts.loan.interest_rate,
            ctx.accounts.loan.loan_term.clone(),
        )?;

        Ok(interest_amount)
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
        let signer_seeds = ctx
            .accounts
            .loan
            .signer_seeds(&ctx.accounts.loan_pda, ctx.program_id)?;
        let signer_seeds = &[&signer_seeds.value()[..]];
        let amount = ctx.accounts.vault.amount;
        token::transfer(
            ctx.accounts
                .to_transfer_receiver_context()
                .with_signer(signer_seeds),
            amount,
        )?;
        token::burn(ctx.accounts.to_burn_nft_context(), 1)?;
        // token::close_account(ctx.accounts.to_close_nft_context())?;
        ctx.accounts.loan.status = LoanStatus::Closed;

        Ok(())
    }

    pub fn split_loan(ctx: Context<SplitLoan>) -> Result<()> {
        Ok(())
    }

    pub fn merge_loan(ctx: Context<MergeLoan>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimNft<'info> {
    pub loan: Box<Account<'info, Loan>>,
    #[account(mut)]
    pub nft_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_pda: AccountInfo<'info>,
}

impl<'info> ClaimNft<'info> {
    fn to_transfer_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.nft_account.to_account_info().clone(),
            to: self.token_account.to_account_info().clone(),
            authority: self.loan_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}
#[derive(Accounts)]
pub struct MergeLoan<'info> {
    pub loan: Box<Account<'info, Loan>>,
}

#[derive(Accounts)]
pub struct SplitLoan<'info> {
    pub loan: Box<Account<'info, Loan>>,
}

#[derive(Accounts)]
pub struct ClaimLoan<'info> {
    pub owner: Signer<'info>,
    pub loan: Box<Account<'info, Loan>>,
    #[account(mut)]
    pub nft_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_destination: UncheckedAccount<'info>,
    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub nft_mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub loan_pda: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> ClaimLoan<'info> {
    fn to_transfer_receiver_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info().clone(),
            to: self.token_account.to_account_info().clone(),
            authority: self.loan_pda.clone(),
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

    fn to_close_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.nft_account.to_account_info().clone(),
            destination: self.nft_destination.to_account_info().clone(),
            authority: self.loan_pda.clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct SettlementAmount<'info> {
    pub loan: Box<Account<'info, Loan>>,
}

#[derive(Accounts)]
pub struct FinalSettlement<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub loan: Box<Account<'info, Loan>>,
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

#[derive(Accounts)]
pub struct EstimateFee<'info> {
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct InitSystem<'info> {
    #[account(mut)]
    pub system_fee_account: Box<Account<'info, TokenAccount>>,
}

pub struct SignerSeeds<'a>([&'a [u8]; 2], [u8; 1]);

impl<'a> SignerSeeds<'a> {
    pub fn value(&self) -> [&[u8]; 3] {
        [self.0[0], self.0[1], &self.1]
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
pub struct Loan {
    pool: Pubkey,
    owner: Pubkey,
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
    status: LoanStatus
}

impl Loan {
    fn signer_seeds<'a>(&'a self, pda: &AccountInfo, program_id: &Pubkey) -> Result<SignerSeeds> {
        let seeds = [b"loan".as_ref(), self.pool.as_ref()];
        let (pubkey, bump) = Pubkey::find_program_address(&seeds, program_id);
        if pubkey != pda.key() {
            return Err(ProgramError::InvalidArgument.into());
        }

        Ok(SignerSeeds(seeds, [bump]))
    }
}

#[derive(Accounts)]
pub struct InitLoan<'info> {
    #[account(zero)]
    pub loan: Box<Account<'info, Loan>>,
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
    fn to_mint_nft_context(&self)-> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
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
    #[account(mut)]
    pub token_depositor: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub loan_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Deposit<'info> {
    fn to_transfer_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
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
    fn signer_seeds<'a>(&'a self, pda: &AccountInfo, program_id: &Pubkey) -> Result<SignerSeeds> {
        let seeds = [b"pool".as_ref(), self.vault_mint.as_ref()];
        let (pubkey, bump) = Pubkey::find_program_address(&seeds, program_id);
        if pubkey != pda.key() {
            return Err(ProgramError::InvalidArgument.into());
        }

        Ok(SignerSeeds(seeds, [bump]))
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
    #[account(mut)]
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