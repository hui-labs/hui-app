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
import React, { useEffect, useState } from "react"
import { Typography } from "antd"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

const { Title } = Typography

const Airdrop = () => {
  const workspace = useWorkspace()
  const [reload, setReload] = useState(false)
  const usdcMint = useGetMint(workspace, USDCPubKey, reload)
  const usdtMint = useGetMint(workspace, USDTPubKey, reload)
  const usdcAccount = useAccount(workspace, usdcMint, undefined, reload)
  const usdtAccount = useAccount(workspace, usdtMint, undefined, reload)

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
    setReload((state) => !state)
  }, [usdcState, usdtState])

  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const balance = useBalance(workspace, undefined, reload)
  const solBalance = useFormatUnit(balance.value)

  return (
    <div className="mt-5">
      <div className="flex justify-between items-center my-3">
        <p className="my-1">
          USDC Balance:{" "}
          <span>{usdcAccount.loading ? "Loading..." : usdcBalance}</span>
        </p>
        <button
          className="p-2 rounded-md bg-indigo-500 hover:bg-slate-800 text-white"
          onClick={() => mintUSDCTo()}
        >
          {usdcState.loading ? "Loading..." : "Faucet +100 USDC"}
        </button>
      </div>
      <div className="flex justify-between items-center my-3">
        <p className="my-1">
          USDT Balance:{" "}
          <span>{usdtAccount.loading ? "Loading..." : usdtBalance}</span>
        </p>
        <button
          className="p-2 rounded-md bg-indigo-500 hover:bg-slate-800 text-white"
          onClick={() => mintUSDTTo()}
        >
          {usdtState.loading ? "Loading..." : "Faucet +100 USDT"}
        </button>
      </div>
      <div className="flex justify-between items-center my-3">
        <p className="my-1">
          Solana Balance:{" "}
          <span>{balance.loading ? "Loading..." : solBalance}</span>
        </p>
        <button
          className="p-2 rounded-md bg-indigo-500 hover:bg-slate-800 text-white"
          onClick={async () => {
            if (workspace.value) {
              const { connection, wallet } = workspace.value
              const tx = await connection.requestAirdrop(
                wallet.publicKey,
                LAMPORTS_PER_SOL * 2
              )
              console.log(tx)
            }
          }}
        >
          {usdtState.loading ? "Loading..." : "Faucet +2 SOL"}
        </button>
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
      <p className="my-1">
        System Fee USDC:{" "}
        <span>{usdcAccount.loading ? "Loading" : usdcBalance}</span>
      </p>
      <p className="my-1">
        System Fee USDT:{" "}
        <span>{usdtAccount.loading ? "Loading" : usdtBalance}</span>
      </p>
    </div>
  )
}

const FaucetPage: React.FC = () => {
  return (
    <div className="max-w-screen-xl mx-auto mt-5 px-6">
      <div className="px-20 pb-20 pt-0 shadow-lg max-w-screen-md mx-auto mt-10">
        <Title className="text-center pt-5 pb-7" level={2}>
          Faucet
        </Title>
        <Airdrop />
        <hr className="my-3" />
        <SystemInfo />
      </div>
    </div>
  )
}

export default FaucetPage
