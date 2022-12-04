import { PublicKey } from "@solana/web3.js"
import axios from "axios"

export const doAirdrop = async (mint: PublicKey, destination: PublicKey) => {
  console.log("11")
  const result = await axios.post("/api/airdrop", {
    mint: mint.toBase58(),
    destination: destination.toBase58(),
  })
  console.log("22", result)
  if (result.status === 200) {
    return result.data
  }

  return null
}
