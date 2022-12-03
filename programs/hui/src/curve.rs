use std::ops::{Div, Mul};

use anchor_lang::prelude::*;

use crate::errors::AppError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LoanTerm {
    TwoMinutes,
    OneMonth,
    ThreeMonths,
    SixMonths,
    NineMonths,
    TwelveMonths,
}

pub struct ConstantProduct;

impl ConstantProduct {
    // pub const DECIMALS: u64 = 10_u64.pow(9);
    // pub const PERCENTAGE_DECIMALS: u64 = 10_u64.pow(4);

    pub fn calc_percentage(&self, amount: u64, threshold: u64) -> Result<u64> {
        let amount = to_u128(amount)?;
        let threshold = to_u128(threshold)?;
        to_u64(amount.mul(threshold).div(1_000_000))
    }

    pub fn calc_interest_amount(&self, amount: u64, interest_rate: u64, loan_term: LoanTerm) -> Result<u64> {
        let received_amount = to_u128(amount)?;
        let interest_rate = to_u128(interest_rate)?;

        let interest_rate_1m = interest_rate.div(12);
        let interest_rate_by_term = match loan_term {
            LoanTerm::TwoMinutes | LoanTerm::OneMonth => interest_rate_1m,
            LoanTerm::ThreeMonths => interest_rate_1m.mul(3),
            LoanTerm::SixMonths => interest_rate_1m.mul(6),
            LoanTerm::NineMonths => interest_rate_1m.mul(9),
            LoanTerm::TwelveMonths => interest_rate_1m.mul(12),
        };
        let interest_amount = received_amount
            .mul(interest_rate_by_term)
            .div(1_000_000);

        to_u64(interest_amount)
    }
}

pub fn to_u128(val: u64) -> Result<u128> {
    val.try_into()
        .map_err(|_| AppError::ConversionFailure.into())
}

pub fn to_u64(val: u128) -> Result<u64> {
    val.try_into()
        .map_err(|_| AppError::ConversionFailure.into())
}
