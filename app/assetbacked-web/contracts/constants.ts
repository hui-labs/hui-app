import idl from "./idl/hello_anchor.json"
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js"

/* Constants for RPC Connection the Solana Blockchain */
export const commitmentLevel = "processed"
export const endpoint =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || clusterApiUrl("devnet")
export const connection = new Connection(endpoint, commitmentLevel)

/* Constants for the Deployed "Hello World" Program */
export const assetBackedProgramId = new PublicKey(idl.metadata.address)
export const assetBackedPInterface = JSON.parse(JSON.stringify(idl))

export const USDCAddress = "7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF"
export const USDTAddress = "JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6"
