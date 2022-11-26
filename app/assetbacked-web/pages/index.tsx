import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
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
import { useState } from "react"
import { Airdrop } from "@/pages/components/AirDrop"
import { useInitPool } from "@/hooks/useInitPool"
import { Account } from "@solana/spl-token/src/state/account"

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
  const [fee, setFee] = useState("0")

  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)

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
        <p>Fee: {fee}</p>
        <button
          onClick={async () => {
            if (!workspace.value) return
            if (!usdtMint.value) return

            const program = workspace.value.program
            const DECIMALS = 10 ** 9
            const topUpAmount = new BN(parseInt(amount) * DECIMALS)
            const estimatedLoanFee: BN = await program.methods
              .estimateLoanFee(topUpAmount)
              .accounts({
                mint: usdtMint.value.address,
              })
              .view()
            setFee(estimatedLoanFee.toString())
          }}
        >
          Estimate
        </button>
        <button
          onClick={async () => {
            if (workspace.value && usdtMint.value) {
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

                const aliceUSDTAssociatedAccount =
                  await getAssociatedTokenAddress(
                    usdtMint.value.address,
                    wallet.publicKey,
                    false,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                  )
                const aliceUSDTAccount = await getAccount(
                  connection,
                  aliceUSDTAssociatedAccount,
                  commitmentLevel
                )
                // console.log("estimatedLoanFee", estimatedLoanFee.toString())
                console.log(
                  "aliceUSDTAccount",
                  aliceUSDTAccount.amount.toString()
                )

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
                    vault: poolVaultUSDTAccount.address,
                    depositor: wallet.publicKey,
                    systemFeeAccount: SystemFeeUSDTPubKey,
                    tokenDepositor: aliceUSDTAccount.address,
                    tokenProgram: TOKEN_PROGRAM_ID,
                  })
                  .preInstructions([ins])
                  .signers([pool])
                  .rpc()
                console.log(tx)
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
              console.log(pools[0].publicKey.toBase58())
            }
          }}
        >
          Load
        </button>
        <hr />
        <button
          onClick={async () => {
            const poolPubkey = new PublicKey(
              "o4reYjc56u8xQGKNo63Khr1UCHcFL13VxQKd8zTsukW"
            )
            if (
              workspace.value &&
              usdtMint.value &&
              usdcAccount.value &&
              usdtAccount.value
            ) {
              const { wallet, program, connection } = workspace.value
              const DECIMALS = 10 ** 9

              const poolAccount = await program.account.pool.fetch(poolPubkey)
              console.log(poolAccount)

              const [poolPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("pool"), usdtMint.value.address.toBuffer()],
                program.programId
              )

              console.log(poolPDA.toBase58())
              // Create mint
              const lamports = await getMinimumBalanceForRentExemptMint(
                connection
              )

              const nftKeypair = Keypair.generate()
              const tx = new Transaction().add(
                SystemProgram.createAccount({
                  fromPubkey: wallet.publicKey,
                  newAccountPubkey: nftKeypair.publicKey,
                  space: MINT_SIZE,
                  lamports,
                  programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMint2Instruction(
                  nftKeypair.publicKey,
                  0,
                  poolPDA,
                  null,
                  TOKEN_PROGRAM_ID
                )
              )

              const { blockhash } = await connection.getRecentBlockhash(
                commitmentLevel
              )
              tx.recentBlockhash = blockhash
              tx.feePayer = wallet.publicKey

              const signed = await wallet.signTransaction(tx)
              signed.partialSign(nftKeypair)
              const txId = await connection.sendRawTransaction(
                signed.serialize()
              )
              await connection.confirmTransaction(txId, commitmentLevel)

              // Create nft token account
              const nftMint = await getMint(
                workspace.value.connection,
                nftKeypair.publicKey,
                commitmentLevel,
                TOKEN_PROGRAM_ID
              )
              const nftTokenAccount = await getOrCreateAssociatedTokenAccount(
                wallet.publicKey,
                nftMint
              )
              if (!nftTokenAccount)
                throw new Error("Can not create pool vault usdt account")
              console.log(nftTokenAccount)

              const loan = web3.Keypair.generate()
              const [loanPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("loan"), poolPubkey.toBuffer()],
                program.programId
              )
              const loanVaultUSDCAccount =
                await getOrCreateAssociatedTokenAccount(
                  loanPDA,
                  usdcMint.value,
                  true
                )
              if (!loanVaultUSDCAccount)
                throw new Error("Can not create loan vault usdc account")

              const loanVaultUSDTAccount =
                await getOrCreateAssociatedTokenAccount(
                  loanPDA,
                  usdtMint.value,
                  true
                )
              if (!loanVaultUSDTAccount)
                throw new Error("Can not create loan vault usdt account")

              console.log("publicKey", loan.publicKey)

              const ins = await program.account.loan.createInstruction(loan)
              await program.methods
                .initLoan(new BN(2 * DECIMALS), {
                  oneMonth: {},
                })
                .accounts({
                  mintNft: nftMint.address,
                  nftTokenAccount: nftTokenAccount.address,
                  loan: loan.publicKey,
                  pool: poolPubkey,
                  poolPda: poolPDA,
                  loanPda: loanPDA,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  poolVault: poolAccount.tokenBAccount,
                  loanAVault: loanVaultUSDCAccount.address,
                  loanBVault: loanVaultUSDTAccount.address,
                  borrower: wallet.publicKey,
                  systemProgram: SystemProgram.programId,
                  systemFeeAccount: SystemFeeUSDTPubKey,
                  tokenDepositor: usdcAccount.value.address,
                  tokenReceiver: usdtAccount.value.address,
                })
                .preInstructions([ins])
                .signers([loan])
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
