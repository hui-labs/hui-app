import fs from "fs"
import path from "path"
import os from "os"
import { web3 } from "@project-serum/anchor"
import base58 from "bs58"

export const getKeypair = () => {
  const privateKeyUint8 = fs.readFileSync(
    path.join(os.homedir(), "/.config/solana/id.json")
  )

  return web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(privateKeyUint8.toString()))
  )
}

export const getPrivateKey = async () => {
  const keypair = getKeypair()
  return base58.encode(keypair.secretKey)
}
