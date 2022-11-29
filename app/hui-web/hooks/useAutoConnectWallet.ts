import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect } from "react"

export const useAutoConnectWallet = () => {
  const { wallet, connect } = useWallet()

  useEffect(() => {
    if (wallet) {
      connect().catch(() => {})
    }
  }, [wallet])
}
