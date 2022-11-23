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
import { Address } from "@/constants"
import { doAirdrop } from "@/services/airdrop"

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
  return useAsyncFn(async () => {
    if (
      workspace.value &&
      mint.value &&
      associatedAccount.value &&
      mint.value &&
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

      return null
    }

    if (mint.value && account.value) {
      return doAirdrop(mint.value.address, account.value.address)
    }
  }, [account, workspace, mint, associatedAccount])
}
