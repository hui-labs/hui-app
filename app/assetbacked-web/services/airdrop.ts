import { PublicKey } from "@solana/web3.js"
import axios from "axios"

export const doAirdrop = async (mint: PublicKey, destination: PublicKey) => {
  const result = await axios.post("/api/airdrop", {
    mint: mint.toBase58(),
    destination: destination.toBase58(),
  })

  if (result.status === 200) {
    return result.data
  }

  return null
}
