use anchor_lang::prelude::*;
use crate::errors::AppError;

pub const INITIAL_SWAP_POOL_AMOUNT: u128 = 1_000_000_000;

pub enum TradeDirection {
    AtoB,
    BtoA,
}

pub enum RoundDirection {
    Ceiling,
    Floor,
}

pub struct ConstantProduct;

impl ConstantProduct {
    // Decimals equals 2
    pub fn calc_loan_fee(&self, loan_fee: u64, amount: u64) -> u64 {
        (amount / 10_u64.pow(9)) * loan_fee
    }

    pub fn calc_max_loan_amount(&self, threshold: u64, amount: u64) -> u64 {
        (amount / 10_u64.pow(9)) * threshold
    }

    pub fn validate_supply(&self, token_a_amount: u64, token_b_amount: u64) -> Result<()> {
        if token_a_amount == 0 {
            return Err(AppError::EmptySupply.into())
        }
        if token_b_amount == 0 {
            return Err(AppError::EmptySupply.into())
        }
        Ok(())
    }

    pub fn new_pool_supply(&self) -> u128 {
        INITIAL_SWAP_POOL_AMOUNT
    }

    pub fn pool_tokens_to_trading_tokens(
        &self,
        pool_tokens: u128,
        pool_token_supply: u128,
        swap_token_a_amount: u128,
        swap_token_b_amount: u128,
        round_direction: RoundDirection,
    ) -> Option<(u128, u128)> {
        msg!(
            "pool_tokens={}, pool_token_supply={}, swap_token_a_amount={}, swap_token_b_amount={}",
            pool_tokens,
            pool_token_supply,
            swap_token_a_amount,
            swap_token_b_amount
        );
        let mut token_a_amount = pool_tokens
            .checked_mul(swap_token_a_amount)?
            .checked_div(pool_token_supply)?;
        let mut token_b_amount = pool_tokens
            .checked_mul(swap_token_b_amount)?
            .checked_div(pool_token_supply)?;

        match round_direction {
            RoundDirection::Floor => Some((token_a_amount, token_b_amount)),
            RoundDirection::Ceiling => {
                let token_a_remainder = pool_tokens
                    .checked_mul(swap_token_a_amount)?
                    .checked_rem(pool_token_supply)?;
                // Also check for 0 token A and B amount to avoid taking too much
                // for tiny amounts of pool tokens.  For example, if someone asks
                // for 1 pool token, which is worth 0.01 token A, we avoid the
                // ceiling of taking 1 token A and instead return 0, for it to be
                // rejected later in processing.
                if token_a_remainder > 0 && token_a_amount > 0 {
                    token_a_amount += 1;
                }
                let token_b_remainder = pool_tokens
                    .checked_mul(swap_token_b_amount)?
                    .checked_rem(pool_token_supply)?;
                if token_b_remainder > 0 && token_b_amount > 0 {
                    token_b_amount += 1;
                }
                Some((token_a_amount, token_b_amount))
            }
        }
    }
}