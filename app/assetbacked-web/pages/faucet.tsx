import { useAnchorWallet } from "@solana/wallet-adapter-react"

export default function Faucet() {
  const wallet = useAnchorWallet()

  return (
    <div>
      <h1>
        Hello <span>{wallet?.publicKey.toBase58()}</span>
      </h1>
    </div>
  )
}
