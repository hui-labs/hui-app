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
      <div className="flex justify-between py-4 border-b max-w-screen-2xl mx-auto">
        <div className="w-[620px] flex justify-between">
          <Link
            className="py-3 text-white w-36 text-center bg-indigo-500 hover:bg-indigo-600 rounded-md"
            href="/lender"
          >
            Lending
          </Link>
          <Link
            className="py-3 text-white w-36 text-center bg-indigo-500 hover:bg-indigo-600 rounded-md"
            href="/borrower"
          >
            Borrowing
          </Link>
          <Link
            className="py-3 text-white w-36 text-center bg-indigo-500 hover:bg-indigo-600 rounded-md"
            href="/market"
          >
            Loan Market
          </Link>
          <Link
            className="py-3 text-white w-36 text-center bg-indigo-500 hover:bg-indigo-600 rounded-md"
            href="/faucet"
          >
            Account Balance
          </Link>
        </div>
        <div>
          <WalletMultiButtonDynamic className="bg-indigo-500 hover:bg-indigo-600" />
        </div>
      </div>
      <hr className="drop-shadow" />
    </>
  )
}

export default Header
