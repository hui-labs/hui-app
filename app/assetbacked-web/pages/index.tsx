import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { useCallback } from "react"
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
import { useGetATA } from "@/hooks/useGetATA"
import { useWorkspace, Workspace } from "@/hooks/useWorkspace"
import { useGetAccount } from "@/hooks/useGetAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { useBalance } from "@/hooks/useBalance"

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
  keypair: Signer
  decimals: number
}
const useMintTo = ({
  decimals,
  account,
  keypair,
  workspace,
  mint,
  associatedAccount,
}: MintToConfig) => {
  return useCallback(async () => {
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
          keypair.publicKey,
          mint.value.address,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )

      tx.recentBlockhash = (
        await workspace.value.connection.getLatestBlockhash("finalized")
      ).blockhash
      tx.feePayer = workspace.value.wallet.publicKey
      const signature = await workspace.value.wallet.signTransaction(tx)
      const id = await workspace.value.connection.sendRawTransaction(
        signature.serialize()
      )
      const result = await workspace.value.connection.confirmTransaction(id)
      console.log("Success 1", result)
    }

    if (workspace.value && mint.value && account.value) {
      const transaction = new Transaction().add(
        createMintToInstruction(
          mint.value.address,
          account.value.address,
          keypair.publicKey,
          10 ** decimals,
          undefined,
          TOKEN_PROGRAM_ID
        )
      )

      const tx = await web3.sendAndConfirmTransaction(
        workspace.value.connection,
        transaction,
        [keypair]
      )
      console.log("Success 2", tx)
    }
  }, [account, keypair, workspace, mint, associatedAccount])
}

export default function Home() {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const associatedAccount = useGetATA(workspace, usdcMint)
  const account = useGetAccount(workspace, associatedAccount)
  const usdcBalance = useFormatUnit(account.value?.amount)
  const createMint = useMintTo({
    workspace,
    mint: usdcMint,
    account,
    keypair,
    associatedAccount,
    decimals: 9,
  })
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value, LAMPORTS_PER_SOL)

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <button onClick={() => createMint()}>Faucet +1 USDC</button>
      <div>
        <h3>
          USDC Balance: <span>{usdcBalance}</span>
        </h3>
        <h3>
          Balance <span>{solBalance}</span>
        </h3>
      </div>
    </div>
  )
}
