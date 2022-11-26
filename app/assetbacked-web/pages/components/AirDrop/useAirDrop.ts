import { useWorkspace } from "@/hooks/useWorkspace"
import { useEffect, useState } from "react"
import { useGetMint } from "@/hooks/useGetMint"
import { USDCPubKey, USDTPubKey } from "@/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { useAccount } from "@/hooks/useAccount"
import { useMintTo } from "@/hooks/useMintTo"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

export const useAirdrop = () => {
  const workspace = useWorkspace()
  const [shouldRefresh, setShouldRefresh] = useState(false)
  const usdcMint = useGetMint(workspace, USDCPubKey, shouldRefresh)
  const usdtMint = useGetMint(workspace, USDTPubKey, shouldRefresh)
  const usdcAssociatedAccount = useAssociatedAccount(
    workspace,
    usdcMint,
    undefined,
    shouldRefresh
  )
  const usdtAssociatedAccount = useAssociatedAccount(
    workspace,
    usdtMint,
    undefined,
    shouldRefresh
  )
  const usdcAccount = useAccount(workspace, usdcMint, undefined, shouldRefresh)
  const usdtAccount = useAccount(workspace, usdtMint, undefined, shouldRefresh)

  const [usdcState, mintUSDCTo] = useMintTo({
    workspace,
    mint: usdcMint,
    account: usdcAccount,
    associatedAccount: usdcAssociatedAccount,
    decimals: 9,
  })
  const [usdtState, mintUSDTTo] = useMintTo({
    workspace,
    mint: usdtMint,
    account: usdtAccount,
    associatedAccount: usdtAssociatedAccount,
    decimals: 9,
  })
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)

  useEffect(() => {
    if (!usdtState.loading) {
      setShouldRefresh((state: boolean) => !state)
    }
  }, [usdcState])

  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value, LAMPORTS_PER_SOL)

  return {
    mintUSDCTo,
    mintUSDTTo,
    usdcState,
    usdtState,
    usdcAccount,
    usdcBalance,
    usdtAccount,
    balance,
    usdtBalance,
    solBalance,
  }
}
