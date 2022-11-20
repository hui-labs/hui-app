use anchor_lang::prelude::*;
use crate::errors::AppError;

pub struct ConstantProduct;

impl ConstantProduct {
    // Decimals equals 2
    pub fn calc_loan_fee(&self, loan_fee: u64, amount: u64) -> u64 {
        (amount / 10_u64.pow(9)) * loan_fee
    }

    pub fn calc_max_loan_amount(&self, threshold: u64, amount: u64) -> u64 {
        (amount / 10_u64.pow(9)) * threshold
    }
}