import Link from "next/link"
import { useAutoConnectWallet } from "@/hooks/useAutoConnectWallet"
import dynamic from "next/dynamic"

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

function Header() {
  useAutoConnectWallet()

  return (
    <>
      <div className="flex justify-between py-4 border-b max-w-screen-lg mx-auto">
        <div className="w-[430px] flex justify-between">
          <Link
            className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
            href="/lend"
          >
            Lend
          </Link>
          <Link
            className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
            href="/borrow"
          >
            Borrow
          </Link>
          <Link
            className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
            href="/market"
          >
            Market
          </Link>
          <Link
            className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
            href="/faucet"
          >
            Faucet
          </Link>
        </div>
        <div>
          <WalletMultiButtonDynamic className="bg-indigo-500" />
        </div>
      </div>
      <hr className="drop-shadow" />
    </>
  )
}

export default Header
