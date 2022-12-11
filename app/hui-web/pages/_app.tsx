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
import { useState } from "react"
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"

export default function App({ Component, pageProps }: AppProps) {
  const phantomWallet = new PhantomWalletAdapter()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL!}>
        <WalletProvider wallets={[phantomWallet]} autoConnect>
          <WalletModalProvider>
            <Layout key={2}>
              <Component {...pageProps} />
            </Layout>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionContextProvider>
  )
}
