import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js"
import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useMintTo } from "@/hooks/useMintTo"
import { useAccount } from "@/hooks/useAccount"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { BN, web3 } from "@project-serum/anchor"
import { useState } from "react"
import { Airdrop } from "@/pages/components/AirDrop"
import { useInitPool } from "@/hooks/useInitPool"

const SystemInfo = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint, SystemFeeUSDCPubKey)
  const usdtAccount = useAccount(workspace, usdtMint, SystemFeeUSDTPubKey)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)

  return (
    <div>
      <p>
        System Fee USDT:{" "}
        <span>{usdcAccount.loading ? "Loading" : usdcBalance}</span>
      </p>
      <p>
        System Fee USDC:{" "}
        <span>{usdtAccount.loading ? "Loading" : usdtBalance}</span>
      </p>
    </div>
  )
}

export default function Home() {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const [amount, setAmount] = useState("2200")
  const [fee, setFee] = useState("0")

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Airdrop />
      <hr />
      <SystemInfo />
      <hr />
      <div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br />
        <p>Fee: {fee}</p>
        <button
          onClick={async () => {
            if (!workspace.value) return
            if (!usdtMint.value) return

            const program = workspace.value.program
            const DECIMALS = 10 ** 9
            const topUpAmount = new BN(parseInt(amount) * DECIMALS)
            const estimatedLoanFee: BN = await program.methods
              .estimateLoanFee(topUpAmount)
              .accounts({
                mint: usdtMint.value.address,
              })
              .view()
            setFee(estimatedLoanFee.toString())
          }}
        >
          Estimate
        </button>
        <button onClick={async () => useInitPool(workspace, usdtMint)}>
          Create pool
        </button>
        <button
          onClick={async () => {
            if (workspace.value && usdtMint.value) {
              const { wallet, program, connection } = workspace.value
              const pools = await program.account.pool.all()
              console.log(pools)
            }
          }}
        >
          Load
        </button>
      </div>
    </div>
  )
}
