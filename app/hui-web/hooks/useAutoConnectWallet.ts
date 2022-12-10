import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect } from "react"
import { PhantomWalletName } from "@solana/wallet-adapter-phantom"

export const useAutoConnectWallet = () => {
  const { wallet, select, disconnecting, connected } = useWallet()

  useEffect(() => {
    const autoConnect = localStorage.getItem("autoConnect")
    if (autoConnect === "true" && !disconnecting && !connected) {
      select(PhantomWalletName)
    }

    if (connected) {
      localStorage.setItem("autoConnect", "true")
    }

    if (disconnecting) {
      localStorage.removeItem("autoConnect")
    }
  }, [wallet, connected, disconnecting])
}
