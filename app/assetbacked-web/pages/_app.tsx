import type { AppProps } from "next/app"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { endpoint } from "./api/constants"
import "@solana/wallet-adapter-react-ui/styles.css"
import "../styles/globals.css"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"

export default function App({ Component, pageProps }: AppProps) {
  const phantomWallet = new PhantomWalletAdapter()

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[phantomWallet]}>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
