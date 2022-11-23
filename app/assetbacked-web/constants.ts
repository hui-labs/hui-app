import { PublicKey } from "@solana/web3.js"

export enum Address {
  USDC = "7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF",
  USDT = "JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6",
  SystemFeeUSDT = "145T6uCSqXbxAJoRf3vBAGvR6KYPtA1kN3sMoV367NT9",
  SystemFeeUSDC = "2N1QrKQZC9DhHRYypnQUhnudP9YMgwvakdc9aj2kw2kA",
}

export const USDCPubKey = new PublicKey(Address.USDC)
export const USDTPubKey = new PublicKey(Address.USDT)
export const SystemFeeUSDTPubKey = new PublicKey(Address.SystemFeeUSDT)
export const SystemFeeUSDCPubKey = new PublicKey(Address.SystemFeeUSDC)
