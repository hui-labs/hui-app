import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js"
import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useMintTo } from "@/hooks/useMintTo"
import { useAccount } from "@/hooks/useAccount"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  createAccount,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  setAuthority,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { useCreateAccount } from "@/hooks/useCreateAccount"
import { createSetAuthorityInstruction } from "@solana/spl-token/src/instructions/setAuthority"
import { BN, web3 } from "@project-serum/anchor"
import { useState } from "react"
import base58 from "bs58"

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
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const [amount, setAmount] = useState("2200")
  const [fee, setFee] = useState("0")

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

              const associatedAccount = await getAssociatedTokenAddress(
                usdtMint.value.address,
                poolPDA,
                true,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )

              let poolVaultUSDTAccount
              try {
                poolVaultUSDTAccount = await getAccount(
                  connection,
                  associatedAccount,
                  commitmentLevel
                )

                console.log(poolVaultUSDTAccount)
              } catch (e) {
                console.log(e)
                const tx = new Transaction().add(
                  createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedAccount,
                    poolPDA,
                    usdtMint.value.address,
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
                const txId = await connection.sendRawTransaction(
                  signed.serialize()
                )
                await connection.confirmTransaction(txId, commitmentLevel)

                poolVaultUSDTAccount = await getAccount(
                  connection,
                  associatedAccount,
                  commitmentLevel
                )
              }

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
