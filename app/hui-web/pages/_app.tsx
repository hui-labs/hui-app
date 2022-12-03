import type { AppProps } from "next/app"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import "@solana/wallet-adapter-react-ui/styles.css"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import Layout from "@/components/Layout"
import "../styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  const phantomWallet = new PhantomWalletAdapter()

  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
      <WalletProvider wallets={[phantomWallet]}>
        <WalletModalProvider>
          <Layout key={2}>
            <Component {...pageProps} />
          </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
