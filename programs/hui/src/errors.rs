use anchor_lang::prelude::ProgramError;
use anchor_lang::solana_program::decode_error::DecodeError;
use num_derive::FromPrimitive;
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum AppError {
    #[error("Input account owner is not the program address")]
    InvalidOwner,
    #[error("Conversion to u64 failed with an overflow or underflow")]
    ConversionFailure,
    #[error("Provided fee is not enough")]
    FeeNotEnough,
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