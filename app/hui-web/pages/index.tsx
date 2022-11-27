import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"
import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useMintTo } from "@/hooks/useMintTo"
import { useAccount } from "@/hooks/useAccount"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { BN, web3 } from "@project-serum/anchor"
import { useState } from "react"

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

  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Airdrop />
      <hr />
      <SystemInfo />
      <hr />
      <div>
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
