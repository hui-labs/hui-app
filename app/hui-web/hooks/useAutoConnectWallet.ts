import { useWallet } from "@solana/wallet-adapter-react"
import useAsyncEffect from "use-async-effect"
import { PhantomWalletName } from "@solana/wallet-adapter-phantom"

export const useAutoConnectWallet = () => {
  const { wallet, select } = useWallet()

  useAsyncEffect(() => {
    select(null)
    select(PhantomWalletName)
  }, [wallet])
}
