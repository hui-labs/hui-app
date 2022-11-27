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
    pub const DECIMALS: u64 = 10_u64.pow(9);
    // Decimals equals 2
    pub fn calc_loan_fee(&self, loan_fee: u64, amount: u64) -> u64 {
        (amount / Self::DECIMALS) * loan_fee
    }

    pub fn calc_max_loan_amount(&self, threshold: u64, amount: u64) -> Result<u64> {
        let amount = to_u128(amount)?;
        let threshold = to_u128(threshold * 100)?;
        to_u64(amount.mul(threshold).div(100_00))
    }

    pub fn calc_interest_amount(&self, amount: u64, interest_rate: u64, loan_term: LoanTerm) -> Result<u128> {
        let received_amount = to_u128(amount)?;
        let interest_rate = to_u128(interest_rate * 100)?;

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
            .div(to_u128(ConstantProduct::DECIMALS)?);

        Ok(interest_amount)
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
