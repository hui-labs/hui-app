use anchor_lang::prelude::ProgramError;
use thiserror::Error;
use num_derive::FromPrimitive;
use anchor_lang::solana_program::decode_error::DecodeError;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum AppError {
    #[error("Swap instruction exceeds desired slippage limit")]
    ExceededSlippage,
    #[error("Given pool token amount results in zero trading tokens")]
    ZeroTradingTokens,
    #[error("Input token account empty")]
    EmptySupply,
    #[error("Input account owner is not the program address")]
    InvalidOwner,
    #[error("Conversion to u64 failed with an overflow or underflow")]
    ConversionFailure,
    #[error("Provided fee is not enough")]
    FeeNotEnough
}

impl From<AppError> for ProgramError {
    fn from(e: AppError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for AppError {
    fn type_of() -> &'static str {
        "Swap Error"
    }
}

impl From<AppError> for anchor_lang::error::Error {
    fn from(e: AppError) -> Self {
        ProgramError::from(e).into()
    }
}