import { PublicKey } from "@solana/web3.js"

const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!
const NEXT_FAUCET_PRIVATE_KEY = process.env.NEXT_FAUCET_PRIVATE_KEY!
const NEXT_PROGRAM_ID = process.env.NEXT_PROGRAM_ID!
const NEXT_USDC_MINT_PUBKEY = process.env.NEXT_USDC_MINT_PUBKEY!
const NEXT_USDT_MINT_PUBKEY = process.env.NEXT_USDT_MINT_PUBKEY!
const NEXT_SYSTEM_USDC_FEE_PUBKEY = process.env.NEXT_SYSTEM_USDC_FEE_PUBKEY!
const NEXT_SYSTEM_USDT_FEE_PUBKEY = process.env.NEXT_SYSTEM_USDT_FEE_PUBKEY!
setTimeout(() => {
  console.log("NEXT_USDC_MINT_PUBKEY", process.env.NEXT_USDC_MINT_PUBKEY!)
}, 300)

export const USDCPubKey = new PublicKey(
  "6MiyjcsrAogzBFK4eg7VUGE1CJZDdZqromW6523GT8hn"
)
export const USDTPubKey = new PublicKey(
  "2cakbZfLktNfmgm5ARRPRZopypJBEdp1pxyx7FRnzifd"
)
export const SystemFeeUSDCPubKey = new PublicKey(
  "7RC9DzgNzrSSdry5MHPCPiBWtjCGr31gcJaz5Vi3fhXA"
)
export const SystemFeeUSDTPubKey = new PublicKey(
  "51Dns2pQnX1ssQRpPRMYgytjSrtc3MuEvpHrYqyhVbRk"
)

export const TOKEN_LISTS: Record<string, string> = {
  "6MiyjcsrAogzBFK4eg7VUGE1CJZDdZqromW6523GT8hn": "USDC",
  "2cakbZfLktNfmgm5ARRPRZopypJBEdp1pxyx7FRnzifd": "USDT",
}
