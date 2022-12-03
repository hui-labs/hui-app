import Link from "next/link"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import useIsMounted from "@/hooks/useIsMounted"
import { useAutoConnectWallet } from "@/hooks/useAutoConnectWallet"

function Header() {
  useAutoConnectWallet()
  const mounted = useIsMounted()

  return (
    <>
      <div className="flex justify-between py-2 border-b max-w-screen-lg mx-auto">
        <div className="w-[350px] flex justify-between">
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
        <div>{mounted && <WalletMultiButton className="bg-indigo-500" />}</div>
      </div>
      <hr className="drop-shadow" />
    </>
  )
}

export default Header
