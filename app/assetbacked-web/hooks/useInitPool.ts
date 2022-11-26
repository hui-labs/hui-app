import { PublicKey, Transaction } from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { commitmentLevel } from "@/hooks/useWorkspace"
import { BN, web3 } from "@project-serum/anchor"
import { SystemFeeUSDTPubKey } from "@/constants"

export const useInitPool = async (workspace, usdtMint) => {
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

      const { blockhash } = await connection.getRecentBlockhash(commitmentLevel)
      tx.recentBlockhash = blockhash
      tx.feePayer = wallet.publicKey

      const signed = await wallet.signTransaction(tx)
      const txId = await connection.sendRawTransaction(signed.serialize())
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

      const aliceUSDTAssociatedAccount = await getAssociatedTokenAddress(
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
      console.log("aliceUSDTAccount", aliceUSDTAccount.amount.toString())

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
}
