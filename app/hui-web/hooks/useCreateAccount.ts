import { useAsyncFn } from "react-use"
import { PublicKey, Transaction } from "@solana/web3.js"
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  Mint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { AsyncState } from "react-use/lib/useAsyncFn"

export interface CreateAccountConfig {
  workspace: AsyncState<Workspace | null>
  mint: AsyncState<Mint | null>
  account: AsyncState<Account | null>
  associatedAccount: AsyncState<PublicKey | null>
}

export const useCreateAccount = ({
  account,
  workspace,
  mint,
  associatedAccount,
}: CreateAccountConfig) => {
  return useAsyncFn(async () => {
    console.log(
      workspace.value && mint.value && associatedAccount.value && account.error
    )
    if (
      workspace.value &&
      mint.value &&
      associatedAccount.value &&
      account.error
    ) {
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          workspace.value.wallet.publicKey,
          associatedAccount.value,
          workspace.value.wallet.publicKey,
          mint.value.address,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )

      const { blockhash } = await workspace.value.connection.getRecentBlockhash(
        commitmentLevel
      )
      tx.recentBlockhash = blockhash
      tx.feePayer = workspace.value.wallet.publicKey

      const signed = await workspace.value.wallet.signTransaction(tx)
      const txId = await workspace.value.connection.sendRawTransaction(
        signed.serialize()
      )
      await workspace.value.connection.confirmTransaction(txId, commitmentLevel)
    }
  }, [account, workspace, mint, associatedAccount])
}
