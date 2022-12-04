import { PublicKey } from "@solana/web3.js"

export const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)

export const USDCPubKey = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT_PUBKEY!
)
export const USDTPubKey = new PublicKey(
  process.env.NEXT_PUBLIC_USDT_MINT_PUBKEY!
)
export const SystemFeeUSDCPubKey = new PublicKey(
  process.env.NEXT_PUBLIC_SYSTEM_USDC_FEE_PUBKEY!
)
export const SystemFeeUSDTPubKey = new PublicKey(
  process.env.NEXT_PUBLIC_SYSTEM_USDT_FEE_PUBKEY!
)

export const TOKEN_LISTS: Record<string, string> = {
  [process.env.NEXT_PUBLIC_USDC_MINT_PUBKEY!]: "USDC",
  [process.env.NEXT_PUBLIC_USDT_MINT_PUBKEY!]: "USDT",
}

export const SYSTEM_LOAN_COMMISSION_FEE = 1_000_000
export const DEFAULT_DECIMALS = 10 ** 9
export const DEFAULT_PERCENTAGE_DECIMALS = 10 ** 4
