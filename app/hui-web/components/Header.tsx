import Link from "next/link"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import useIsMounted from "@/hooks/useIsMounted"
import { useAutoConnectWallet } from "@/hooks/useAutoConnectWallet"

function Header() {
  useAutoConnectWallet()
  const mounted = useIsMounted()

  return (
    <div className="flex justify-between px-6 py-2 border-b drop-shadow">
      <div className="w-1/4 flex justify-between">
        <Link
          className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
          href="/lender"
        >
          Lender
        </Link>
        <Link
          className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
          href="/borrower"
        >
          Borrower
        </Link>
        <Link
          className="p-3 text-white w-24 text-center bg-indigo-500 hover:bg-slate-800 rounded-md"
          href="/faucet"
        >
          Faucet
        </Link>
      </div>
      <div>{mounted && <WalletMultiButton className="bg-indigo-500" />}</div>
    </div>
  )
}

export default Header
