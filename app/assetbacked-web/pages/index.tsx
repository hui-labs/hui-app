import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { useCallback, useState } from "react"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  Transaction,
} from "@solana/web3.js"
import { web3 } from "@project-serum/anchor"
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  Mint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { useGetMint } from "@/hooks/useGetMint"
import { Address } from "@/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { commitmentLevel, useWorkspace, Workspace } from "@/hooks/useWorkspace"
import { useGetAccount } from "@/hooks/useGetAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { useBalance } from "@/hooks/useBalance"
import axios from "axios"
import { useAsyncFn } from "react-use"

const USDCPubKey = new PublicKey(Address.USDC)
const keypair = Keypair.fromSecretKey(
  Uint8Array.from([
    74, 99, 85, 55, 156, 98, 150, 169, 98, 37, 52, 220, 194, 13, 15, 90, 32,
    172, 232, 219, 190, 121, 235, 48, 197, 223, 217, 111, 36, 53, 154, 14, 243,
    32, 226, 220, 39, 161, 168, 191, 223, 145, 118, 180, 98, 5, 195, 135, 140,
    25, 7, 92, 154, 226, 47, 3, 13, 148, 250, 63, 30, 37, 204, 97,
  ])
)

interface MintToConfig {
  workspace: AsyncState<Workspace | null>
  mint: AsyncState<Mint | null>
  account: AsyncState<Account | null>
  associatedAccount: AsyncState<PublicKey | null>
  decimals: number
}

const doAirdrop = async (mint: PublicKey, destination: PublicKey) => {
  const result = await axios.post("/api/airdrop", {
    mint: mint.toBase58(),
    destination: destination.toBase58(),
  })

  if (result.status === 200) {
    return result.data
  }

  return null
}

const useMintTo = ({
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
  }, [account, keypair, workspace, mint, associatedAccount])
}

export default function Home() {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const associatedAccount = useAssociatedAccount(workspace, usdcMint)
  const account = useGetAccount(workspace, associatedAccount)
  const [state, minTo] = useMintTo({
    workspace,
    mint: usdcMint,
    account,
    associatedAccount,
    decimals: 9,
  })
  const usdcBalance = useFormatUnit(account.value?.amount)
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value, LAMPORTS_PER_SOL)

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <button onClick={() => minTo()}>
        {state.loading ? "Loading..." : "Faucet +100 USDC"}
      </button>
      <div>
        <p>
          USDC Balance: <span>{usdcBalance}</span>
        </p>
        <p>
          Balance <span>{solBalance}</span>
        </p>
      </div>
    </div>
  )
}
