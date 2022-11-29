import { useWallet } from "@solana/wallet-adapter-react"
import useAsyncEffect from "use-async-effect"

export const useAutoConnectWallet = () => {
  const { wallet, connect } = useWallet()

  useAsyncEffect(() => {
    if (wallet) {
      connect().catch(() => {})
    }
  }, [wallet])
}
