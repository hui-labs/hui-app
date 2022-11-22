import { useProvider } from "./useProvider"
import { useEffect, useState } from "react"
import { PublicKey } from "@solana/web3.js"

export const useAccount = () => {
  const provider = useProvider()
  const [publicKey, setPublicKey] = useState<PublicKey>()

  useEffect(() => {
    setPublicKey(provider?.wallet.publicKey)
  }, [provider])

  return {
    publicKey,
    address: publicKey?.toBase58(),
  }
}
