import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"
import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useMintTo } from "@/hooks/useMintTo"
import { useAccount } from "@/hooks/useAccount"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  createInitializeMint2Instruction,
  MINT_SIZE,
  createMint,
  createAccount,
  Mint,
  getMint,
} from "@solana/spl-token"
import { BN, web3 } from "@project-serum/anchor"
import { useMemo, useState } from "react"
import { Account } from "@solana/spl-token/src/state/account"

export const Airdrop = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAssociatedAccount = useAssociatedAccount(workspace, usdcMint)
  const usdtAssociatedAccount = useAssociatedAccount(workspace, usdtMint)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
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
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value, LAMPORTS_PER_SOL)

  return (
    <div>
      <button onClick={() => mintUSDCTo()}>
        {usdcState.loading ? "Loading..." : "Faucet +100 USDC"}
      </button>
      <button onClick={() => mintUSDTTo()}>
        {usdtState.loading ? "Loading..." : "Faucet +100 USDT"}
      </button>
      <div>
        <p>
          USDC Balance:{" "}
          <span>{usdcAccount.loading ? "Loading..." : usdcBalance}</span>
        </p>
        <p>
          USDT Balance:{" "}
          <span>{usdtAccount.loading ? "Loading..." : usdtBalance}</span>
        </p>
        <p>
          Balance <span>{balance.loading ? "Loading..." : solBalance}</span>
        </p>
      </div>
    </div>
  )
}

const SystemInfo = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint, SystemFeeUSDCPubKey)
  const usdtAccount = useAccount(workspace, usdtMint, SystemFeeUSDTPubKey)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)

  return (
    <div>
      <p>
        System Fee USDT:{" "}
        <span>{usdcAccount.loading ? "Loading" : usdcBalance}</span>
      </p>
      <p>
        System Fee USDC:{" "}
        <span>{usdtAccount.loading ? "Loading" : usdtBalance}</span>
      </p>
    </div>
  )
}

export default function Home() {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const [amount, setAmount] = useState("2200")

  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)

  const estimatedLoanFee = useMemo(() => {
    const SYSTEM_LOAN_FEE = 1_000_000
    return (parseInt(amount) / 10 ** 9) * SYSTEM_LOAN_FEE
  }, [amount])

  async function getOrCreateAssociatedTokenAccount(
    owner: PublicKey,
    mint: Mint,
    allowOwnerOffCurve = false
  ) {
    if (workspace.value && usdtMint.value && usdcMint.value) {
      const { wallet, connection } = workspace.value

      const associatedAccount = await getAssociatedTokenAddress(
        mint.address,
        owner,
        allowOwnerOffCurve,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      let account: Account
      try {
        account = await getAccount(
          connection,
          associatedAccount,
          commitmentLevel
        )

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

        const { blockhash } = await connection.getRecentBlockhash(
          commitmentLevel
        )
        tx.recentBlockhash = blockhash
        tx.feePayer = wallet.publicKey

        const signed = await wallet.signTransaction(tx)
        const txId = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txId, commitmentLevel)

        account = await getAccount(
          connection,
          associatedAccount,
          commitmentLevel
        )
      }

      return account
    }
  }

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Airdrop />
      <hr />
      <SystemInfo />
      <hr />
      <div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br />
        <p>Fee: {estimatedLoanFee} USD</p>
        <button
          onClick={async () => {
            if (workspace.value && usdtMint.value && usdcMint.value) {
              const { wallet, program, connection } = workspace.value

              const [poolPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("pool"), usdtMint.value.address.toBuffer()],
                program.programId
              )

              const poolVaultUSDTAccount =
                await getOrCreateAssociatedTokenAccount(
                  poolPDA,
                  usdtMint.value,
                  true
                )
              if (!poolVaultUSDTAccount)
                throw new Error("Can not create pool vault usdt account")

              try {
                const DECIMALS = 10 ** 9
                const topUpAmount = new BN(10 * DECIMALS)

                const usdtAssociatedAccount = await getAssociatedTokenAddress(
                  usdtMint.value.address,
                  wallet.publicKey,
                  false,
                  TOKEN_PROGRAM_ID,
                  ASSOCIATED_TOKEN_PROGRAM_ID
                )
                const usdtAccount = await getAccount(
                  connection,
                  usdtAssociatedAccount,
                  commitmentLevel
                )
                // console.log("estimatedLoanFee", estimatedLoanFee.toString())
                console.log("usdtAccount", usdtAccount.amount.toString())

                const vaultKeypair = web3.Keypair.generate()
                const pool = web3.Keypair.generate()
                const ins = await program.account.pool.createInstruction(pool)
                const tx = await program.methods
                  .initPool(
                    {
                      interestRate: new BN(10),
                      maxLoanAmount: new BN(100 * DECIMALS),
                      maxLoanThreshold: new BN(0.8 * DECIMALS),
                      minLoanAmount: new BN(10 * DECIMALS),
                    },
                    topUpAmount,
                    new BN("2200000000")
                  )
                  .accounts({
                    pool: pool.publicKey,
                    pda: poolPDA,
                    systemProgram: SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    vaultMint: usdtMint.value.address,
                    collateralMint: usdcMint.value.address,
                    vaultAccount: vaultKeypair.publicKey,
                    depositor: wallet.publicKey,
                    systemFeeAccount: SystemFeeUSDTPubKey,
                    tokenDepositor: usdtAccount.address,
                    tokenProgram: TOKEN_PROGRAM_ID,
                  })
                  .preInstructions([ins])
                  .signers([pool, vaultKeypair])
                  .rpc()
                console.log(pool.publicKey.toBase58())
              } catch (e) {
                console.log(e)
              }
            }
          }}
        >
          Create pool
        </button>
        <button
          onClick={async () => {
            if (workspace.value && usdtMint.value) {
              const { wallet, program, connection } = workspace.value
              const pools = await program.account.pool.all()
              console.log(pools)
            }
          }}
        >
          Load
        </button>
        <hr />
        <button
          onClick={async () => {
            const poolPubkey = new PublicKey(
              "6tmV5DgDgLjy6zgDeTAiULQoTgrbyUcyGPPZNQTK6fhm"
            )
            if (
              workspace.value &&
              usdtMint.value &&
              usdcAccount.value &&
              usdtAccount.value
            ) {
              const { wallet, program } = workspace.value
              const DECIMALS = 10 ** 9

              const poolAccount = await program.account.pool.fetch(poolPubkey)

              const [poolPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("pool"), usdtMint.value.address.toBuffer()],
                program.programId
              )

              const loan = web3.Keypair.generate()
              const [loanPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("loan"), poolPubkey.toBuffer()],
                program.programId
              )
              console.log("publicKey", loan.publicKey)

              const vaultKeypair = Keypair.generate()
              const collateralAccountKeypair = Keypair.generate()
              const nftMintKeypair = Keypair.generate()
              const nftAccountKeypair = Keypair.generate()
              const ins = await program.account.loan.createInstruction(loan)
              await program.methods
                .initLoan(new BN(2 * DECIMALS), {
                  oneMonth: {},
                })
                .accounts({
                  vaultAccount: vaultKeypair.publicKey,
                  vaultMint: usdtMint.value.address,
                  collateralMint: usdcMint.value!.address,
                  collateralAccount: collateralAccountKeypair.publicKey,
                  rent: web3.SYSVAR_RENT_PUBKEY,
                  nftMint: nftMintKeypair.publicKey,
                  nftAccount: nftAccountKeypair.publicKey,
                  loan: loan.publicKey,
                  pool: poolPubkey,
                  poolPda: poolPDA,
                  loanPda: loanPDA,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  poolVault: poolAccount.vaultAccount,
                  borrower: wallet.publicKey,
                  systemProgram: SystemProgram.programId,
                  systemFeeAccount: SystemFeeUSDTPubKey,
                  tokenDepositor: usdcAccount.value.address,
                  tokenReceiver: usdtAccount.value.address,
                })
                .preInstructions([ins])
                .signers([
                  loan,
                  nftMintKeypair,
                  nftAccountKeypair,
                  collateralAccountKeypair,
                  vaultKeypair,
                ])
                .rpc()
              console.log("created")
            }
          }}
        >
          Create loan
        </button>
        <button
          onClick={async () => {
            if (workspace.value) {
              const { program } = workspace.value
              const pools = await program.account.loan.all()
              console.log(pools)
            }
          }}
        >
          Load
        </button>
      </div>
    </div>
  )
}
