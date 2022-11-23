import { PublicKey } from "@solana/web3.js"

export enum Address {
  USDC = "7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF",
  USDT = "JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6",
}

export const USDCPubKey = new PublicKey(Address.USDC)
