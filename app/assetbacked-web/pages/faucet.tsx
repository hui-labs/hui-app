import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { useWallet } from "@solana/wallet-adapter-react"
import { Keypair, PublicKey, Signer, Transaction } from "@solana/web3.js"
import { web3 } from "@project-serum/anchor"
import { useAsync } from "react-use"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token"
import { useProvider } from "../hooks/useProvider"
import { useAccount } from "../hooks/useAccount"
import { useBalance } from "../hooks/useBalance"

const USDC_ADDRESS = "7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF"
const USDT_ADDRESS = "JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6"
// USDC: 7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF
// USDT: JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6

interface AccountTokenParams {
  payer: Signer
  mint: PublicKey
}

export default function Home() {
  const mounted = useIsMounted()
  const { publicKey, address } = useAccount()
  const { loading, balance, error } = useBalance()
  const wallet = useWallet()
  const provider = useProvider()

  const usdcBalance = useAsync(async () => {
    if (provider && publicKey) {
      const usdcMint = await getMint(
        provider.connection,
        new PublicKey(USDC_ADDRESS),
        "processed",
        TOKEN_PROGRAM_ID
      )

      const associatedToken = await getAssociatedTokenAddress(
        usdcMint.address,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      const account = await getAccount(
        provider.connection,
        associatedToken,
        "processed"
      )

      console.log(account)
      return (account.amount / 1_000_000_000n).toString()
    }

    return 0
  }, [provider, publicKey])

  const onClick = async () => {
    if (provider && publicKey) {
      const usdcMint = await getMint(
        provider.connection,
        new PublicKey(USDC_ADDRESS),
        "processed",
        TOKEN_PROGRAM_ID
      )

      const associatedToken = await getAssociatedTokenAddress(
        usdcMint.address,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      try {
        const account = await getAccount(
          provider.connection,
          associatedToken,
          "processed"
        )

        console.log("account", account.amount)

        const keypair = Keypair.fromSecretKey(
          Uint8Array.from([
            74, 99, 85, 55, 156, 98, 150, 169, 98, 37, 52, 220, 194, 13, 15, 90,
            32, 172, 232, 219, 190, 121, 235, 48, 197, 223, 217, 111, 36, 53,
            154, 14, 243, 32, 226, 220, 39, 161, 168, 191, 223, 145, 118, 180,
            98, 5, 195, 135, 140, 25, 7, 92, 154, 226, 47, 3, 13, 148, 250, 63,
            30, 37, 204, 97,
          ])
        )
        const transaction = new Transaction().add(
          createMintToInstruction(
            usdcMint.address,
            account.address,
            keypair.publicKey,
            100 * 10 ** 9,
            undefined,
            TOKEN_PROGRAM_ID
          )
        )

        const tx = await web3.sendAndConfirmTransaction(
          provider.connection,
          transaction,
          [keypair]
        )
        console.log(tx)
      } catch (e) {
        console.log(e)
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedToken,
            publicKey,
            usdcMint.address,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )

        const signature = await wallet.sendTransaction(
          transaction,
          provider.connection
        )

        await provider.connection.confirmTransaction(signature, "processed")
        console.log("Success")
      }
    }
  }

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <button onClick={onClick}>Faucet +100 USDC</button>
      <div>
        <h3>
          USDC Balance: <span>{usdcBalance.value}</span>
        </h3>
        <h3>
          Balance <span>{balance}</span>
        </h3>
      </div>
    </div>
  )
}
