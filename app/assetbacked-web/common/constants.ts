import { PublicKey } from "@solana/web3.js"

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
