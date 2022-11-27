import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { PublicKey, Transaction } from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  Mint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { Account } from "@solana/spl-token/src/state/account"

export async function getOrCreateAssociatedTokenAccount(
  workspace: Workspace,
  owner: PublicKey,
  mint: Mint,
  allowOwnerOffCurve = false
) {
  const { wallet, connection } = workspace

  const associatedAccount = await getAssociatedTokenAddress(
    mint.address,
    owner,
    allowOwnerOffCurve,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  let account: Account
  try {
    account = await getAccount(connection, associatedAccount, commitmentLevel)

    console.log(account)
  } catch (e) {
    console.log(e)
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedAccount,
        owner,
        mint.address,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )

    const { blockhash } = await connection.getRecentBlockhash(commitmentLevel)
    tx.recentBlockhash = blockhash
    tx.feePayer = wallet.publicKey

    const signed = await wallet.signTransaction(tx)
    const txId = await connection.sendRawTransaction(signed.serialize())
    await connection.confirmTransaction(txId, commitmentLevel)

    account = await getAccount(connection, associatedAccount, commitmentLevel)
  }

  return account
}
