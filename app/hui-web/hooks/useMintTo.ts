import { useAsyncFn } from "react-use"
import { PublicKey } from "@solana/web3.js"
import { Account, Mint } from "@solana/spl-token"
import { Workspace } from "@/hooks/useWorkspace"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { doAirdrop } from "@/services/airdrop"
import { getOrCreateAssociatedTokenAccount } from "@/services"

export interface MintToConfig {
  workspace: AsyncState<Workspace | null>
  mint: AsyncState<Mint | null>
  account: AsyncState<Account | null>
  owner?: AsyncState<PublicKey | null>
}

export const useMintTo = ({
  account,
  workspace,
  mint,
  owner,
}: MintToConfig) => {
  return useAsyncFn(async () => {
    if (workspace.value && mint.value) {
      const { wallet } = workspace.value
      const account = await getOrCreateAssociatedTokenAccount(
        workspace.value,
        owner ? owner.value! : wallet.publicKey,
        mint.value
      )

      await doAirdrop(mint.value.address, account.address)
    }
  }, [mint.value, account.value])
}
