import { useAsyncFn } from "react-use"
import { PublicKey } from "@solana/web3.js"
import { Account, Mint } from "@solana/spl-token"
import { Workspace } from "@/hooks/useWorkspace"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { doAirdrop } from "@/services/airdrop"
import { useCreateAccount } from "@/hooks/useCreateAccount"

export interface MintToConfig {
  workspace: AsyncState<Workspace | null>
  mint: AsyncState<Mint | null>
  account: AsyncState<Account | null>
  associatedAccount: AsyncState<PublicKey | null>
  decimals: number
}

export const useMintTo = ({
  decimals,
  account,
  workspace,
  mint,
  associatedAccount,
}: MintToConfig) => {
  const [state, createAccount] = useCreateAccount({
    account,
    workspace,
    mint,
    associatedAccount,
  })

  return useAsyncFn(async () => {
    if (state.value && mint.value && account.value && account.error) {
      await createAccount()
      return doAirdrop(mint.value.address, account.value.address)
    }

    if (mint.value && account.value) {
      return doAirdrop(mint.value.address, account.value.address)
    }
  }, [state.value, mint.value, account.value])
}
