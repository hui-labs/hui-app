import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
} from "@solana/web3.js"
import { AnchorProvider } from "@project-serum/anchor/dist/cjs/provider"
import { Program, web3 } from "@project-serum/anchor"
import { HelloAnchor } from "../contracts/types/hello_anchor"
import { useAsync } from "react-use"
import {
  assetBackedPInterface,
  assetBackedProgramId,
} from "../contracts/constants"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token"

const useProvider = () => {
  const wallet = useAnchorWallet()
  const [provider, setProvider] = useState<AnchorProvider>()

  useEffect(() => {
    if (wallet) {
      const network =
        "https://solana-devnet.g.alchemy.com/v2/DUPxh6-6BQsfz8p5EIT0pghxVoMsCs4l"
      const connection = new Connection(network, "processed")

      setProvider(
        new AnchorProvider(connection, wallet, {
          preflightCommitment: "processed",
        })
      )
    }
  }, [wallet])

  return provider
}

const useAccount = () => {
  const provider = useProvider()
  const [publicKey, setPublicKey] = useState<PublicKey>()

  useEffect(() => {
    setPublicKey(provider?.wallet.publicKey)
  }, [provider])

  return {
    publicKey,
    address: publicKey?.toBase58(),
  }
}

const USDC_ADDRESS = "7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF"
const USDT_ADDRESS = "JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6"
// USDC: 7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF
// USDT: JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6
const useBalance = () => {
  const provider = useProvider()
  const { publicKey } = useAccount()

  const state = useAsync(async () => {
    if (publicKey) {
      return provider?.connection.getBalance(publicKey)
    }

    return 0
  }, [provider, publicKey])

  return {
    error: state.error,
    balance: state.value,
    loading: state.loading,
  }
}

interface AccountTokenParams {
  payer: Signer
  mint: PublicKey
}

const useProgram = () => {
  const provider = useProvider()
  const [program, setProgram] = useState<Program<HelloAnchor>>()

  useEffect(() => {
    const program = new Program(
      assetBackedPInterface,
      assetBackedProgramId,
      provider
    )
    setProgram(program)
  }, [])

  return program
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

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <button
        onClick={async () => {
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
                  74, 99, 85, 55, 156, 98, 150, 169, 98, 37, 52, 220, 194, 13,
                  15, 90, 32, 172, 232, 219, 190, 121, 235, 48, 197, 223, 217,
                  111, 36, 53, 154, 14, 243, 32, 226, 220, 39, 161, 168, 191,
                  223, 145, 118, 180, 98, 5, 195, 135, 140, 25, 7, 92, 154, 226,
                  47, 3, 13, 148, 250, 63, 30, 37, 204, 97,
                ])
              )
              const transaction = new Transaction().add(
                createMintToInstruction(
                  usdcMint.address,
                  account.address,
                  keypair.publicKey,
                  10 ** 9,
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

              await provider.connection.confirmTransaction(
                signature,
                "processed"
              )
              console.log("Success")
            }
          }
        }}
      >
        Faucet +1 USDC
      </button>
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
