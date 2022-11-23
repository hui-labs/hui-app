import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { AnchorProvider } from "@project-serum/anchor/dist/cjs/provider"
import { Connection } from "@solana/web3.js"

export const useProvider = () => {
  const wallet = useAnchorWallet()
  const [provider, setProvider] = useState<AnchorProvider>()

  useEffect(() => {
    if (wallet) {
      const network =
        "https://solana-devnet.g.alchemy.com/v2/DUPxh6-6BQsfz8p5EIT0pghxVoMsCs4l"
      const connection = new Connection(network, "processed")

      setProvider(
        new AnchorProvider(connection, wallet, {
          preflightCommitment: "processed",
        })
      )
    }
  }, [wallet])

  return provider
}
