import { web3 } from "@project-serum/anchor"
import * as fs from "fs"
import base58 from "bs58"

const privateKeyUint8 = fs.readFileSync(
  "/Users/linh.tran/.config/solana/id.json"
)
const keypair = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(privateKeyUint8.toString()))
)

console.log(base58.encode(keypair.secretKey))
