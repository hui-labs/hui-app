import type { AppProps } from "next/app"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import {
  ConnectionProvider,
  useAnchorWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import "@solana/wallet-adapter-react-ui/styles.css"
// import "../styles/globals.css"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"

export default function App({ Component, pageProps }: AppProps) {
  const phantomWallet = new PhantomWalletAdapter()

  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
      <WalletProvider wallets={[phantomWallet]}>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
