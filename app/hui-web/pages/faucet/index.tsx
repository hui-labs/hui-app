import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useAccount } from "@/hooks/useAccount"
import { useMintTo } from "@/hooks/useMintTo"
import React, { useEffect } from "react"

const Airdrop = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)

  const [usdcState, mintUSDCTo] = useMintTo({
    workspace,
    mint: usdcMint,
    account: usdcAccount,
  })
  const [usdtState, mintUSDTTo] = useMintTo({
    workspace,
    mint: usdtMint,
    account: usdtAccount,
  })
  useEffect(() => {
    console.log("usdcAccount", usdcAccount.value?.amount)
  }, [usdcAccount])
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value)

  return (
    <div className="mt-5">
      <div className="my-3">
        <button
          className="p-2 mr-2 rounded-md bg-indigo-500 hover:bg-slate-800 text-white"
          onClick={() => mintUSDCTo()}
        >
          {usdcState.loading ? "Loading..." : "Faucet +100 USDC"}
        </button>
        <button
          className="p-2 mr-2 rounded-md bg-indigo-500 hover:bg-slate-800 text-white"
          onClick={() => mintUSDTTo()}
        >
          {usdtState.loading ? "Loading..." : "Faucet +100 USDT"}
        </button>
      </div>
      <div>
        <p>
          USDC Balance:{" "}
          <span>{usdcAccount.loading ? "Loading..." : usdcBalance}</span>
        </p>
        <p>
          USDT Balance:{" "}
          <span>{usdtAccount.loading ? "Loading..." : usdtBalance}</span>
        </p>
        <p>
          Balance <span>{balance.loading ? "Loading..." : solBalance}</span>
        </p>
      </div>
    </div>
  )
}

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
        System Fee USDC:{" "}
        <span>{usdcAccount.loading ? "Loading" : usdcBalance}</span>
      </p>
      <p>
        System Fee USDT:{" "}
        <span>{usdtAccount.loading ? "Loading" : usdtBalance}</span>
      </p>
    </div>
  )
}

const FaucetPage: React.FC = () => {
  return (
    <div className="px-6">
      <Airdrop />
      <hr className="my-2" />
      <SystemInfo />
    </div>
  )
}

export default FaucetPage
