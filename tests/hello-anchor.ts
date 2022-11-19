import * as anchor from "@project-serum/anchor"
import { BN, Program, web3 } from "@project-serum/anchor"
import { HelloAnchor } from "../target/types/hello_anchor"
import {
  AuthorityType,
  createAccount,
  createMint,
  getAccount,
  getMint,
  mintTo,
  setAuthority,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"

describe("hello-anchor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.HelloAnchor as Program<HelloAnchor>
  const connection = program.provider.connection

  it("Is initialized!", async () => {
    const alice = web3.Keypair.generate()
    const bob = web3.Keypair.generate()
    const systemFee = web3.Keypair.generate()

    const wallet = NodeWallet.local()
    const admin = wallet.payer
    await connection.requestAirdrop(systemFee.publicKey, LAMPORTS_PER_SOL * 10)
    await connection.requestAirdrop(alice.publicKey, LAMPORTS_PER_SOL * 10)
    await connection.requestAirdrop(bob.publicKey, LAMPORTS_PER_SOL * 10)

    // Create USDC and USDT token
    const usdcMintPubkey = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      9,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const usdtMintPubkey = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      9,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    const [poolPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        usdcMintPubkey.toBuffer(),
        usdtMintPubkey.toBuffer(),
      ],
      program.programId
    )

    // Create system fee account
    const systemFeeAccount = await createAccount(
      connection,
      systemFee,
      usdtMintPubkey,
      systemFee.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Create token accounts for Alice
    const aliceUSDCAccount = await createAccount(
      connection,
      alice,
      usdcMintPubkey,
      alice.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const aliceUSDTAccount = await createAccount(
      connection,
      alice,
      usdtMintPubkey,
      alice.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Create token accounts for Bob
    const bobUSDCAccount = await createAccount(
      connection,
      bob,
      usdcMintPubkey,
      bob.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const bobUSDTAccount = await createAccount(
      connection,
      bob,
      usdtMintPubkey,
      bob.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Create token accounts for PDA
    const pdaUSDCAccount = await createAccount(
      connection,
      admin,
      usdcMintPubkey,
      admin.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const pdaUSDTAccount = await createAccount(
      connection,
      admin,
      usdtMintPubkey,
      admin.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Assign authority for poolPDA account
    await setAuthority(
      connection,
      admin,
      pdaUSDCAccount,
      admin.publicKey,
      AuthorityType.AccountOwner,
      poolPDA,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    await setAuthority(
      connection,
      admin,
      pdaUSDTAccount,
      admin.publicKey,
      AuthorityType.AccountOwner,
      poolPDA,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Get mint accounts
    const usdcMint = await getMint(
      connection,
      usdcMintPubkey,
      null,
      TOKEN_PROGRAM_ID
    )
    const usdtMint = await getMint(
      connection,
      usdtMintPubkey,
      null,
      TOKEN_PROGRAM_ID
    )

    // Mint tokens for PDA account
    const DEFAULT_TOKEN_A = 1_000_000
    const DEFAULT_TOKEN_B = 1_000_000
    const DECIMALS = 10 ** 9

    // await mintTo(
    //   connection,
    //   admin,
    //   usdcMint.address,
    //   pdaUSDCAccount,
    //   usdcMint.mintAuthority,
    //   100
    // )
    // await mintTo(
    //   connection,
    //   admin,
    //   usdtMint.address,
    //   pdaUSDTAccount,
    //   usdtMint.mintAuthority,
    //   100
    // )

    // Mint tokens for Alice account
    // await mintTo(
    //   connection,
    //   admin,
    //   usdcMint.address,
    //   aliceUSDCAccount,
    //   usdcMint.mintAuthority,
    //   200
    // )
    await mintTo(
      connection,
      admin,
      usdtMint.address,
      aliceUSDTAccount,
      usdtMint.mintAuthority,
      200 * DECIMALS
    )

    // Mint tokens for Bob account
    await mintTo(
      connection,
      admin,
      usdcMint.address,
      bobUSDCAccount,
      usdcMint.mintAuthority,
      100 * DECIMALS
    )
    // await mintTo(
    //   connection,
    //   admin,
    //   usdtMint.address,
    //   aliceUSDTAccount,
    //   usdtMint.mintAuthority,
    //   100
    // )
    const topUpAmount = new BN(100 * DECIMALS)
    const requiredLoanFee: BN = await program.methods
      .estimateLoanFee(topUpAmount)
      .accounts({
        mint: usdcMint.address,
      })
      .view()
    console.log(requiredLoanFee.toString())

    const pool = web3.Keypair.generate()
    const tx = await program.methods
      .initPool(
        {
          interestRate: new BN(10), // 0.001
          maxLoanAmount: new BN(100 * DECIMALS),
          maxLoanThreshold: new BN(0.8 * DECIMALS),
          minLoanAmount: new BN(10 * DECIMALS),
          repaymentPeriod: {
            oneHour: {},
          } as never,
        },
        topUpAmount,
        requiredLoanFee
      )
      .accounts({
        pool: pool.publicKey,
        pda: poolPDA,
        tokenAForPda: pdaUSDCAccount,
        tokenBForPda: pdaUSDTAccount,
        depositor: alice.publicKey,
        systemFeeAccount: systemFeeAccount,
        tokenAForDepositor: aliceUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([await program.account.pool.createInstruction(pool)])
      .signers([alice, pool])
      .rpc()

    console.log("Your transaction signature", tx)
    console.table([
      {
        name: "Pool",
        address: pool.publicKey.toBase58(),
        owner: (
          await connection.getAccountInfo(pool.publicKey)
        ).owner.toBase58(),
      },
    ])
    console.log("Token Account")

    // Get Alice accounts
    const usdcForAliceAccount = await getAccount(
      connection,
      aliceUSDCAccount,
      null,
      TOKEN_PROGRAM_ID
    )
    const usdtForAliceAccount = await getAccount(
      connection,
      aliceUSDTAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    // Get Alice accounts
    const usdcForBobAccount = await getAccount(
      connection,
      bobUSDCAccount,
      null,
      TOKEN_PROGRAM_ID
    )
    const usdtForBobAccount = await getAccount(
      connection,
      bobUSDTAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    // Get PDA accounts
    const usdcForPDAAccount = await getAccount(
      connection,
      pdaUSDCAccount,
      null,
      TOKEN_PROGRAM_ID
    )
    const usdtForPDAAccount = await getAccount(
      connection,
      pdaUSDTAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    // Get system fee account
    const systemFeeForAdminAccount = await getAccount(
      connection,
      systemFeeAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    const getTokenBalance = async (
      connection: web3.Connection,
      pubkey: PublicKey
    ) => {
      try {
        return parseInt(
          (await connection.getTokenAccountBalance(pubkey)).value.amount
        )
      } catch (e) {
        console.error(`Not a token account ${pubkey}`)
        return NaN
      }
    }

    const depositAll = async (
      name: string,
      amount: number,
      user: web3.Keypair,
      poolForUser: PublicKey,
      aForUser: PublicKey,
      bForUser: PublicKey
    ) => {
      const aForPDA = await getAccount(
        connection,
        pdaUSDCAccount,
        null,
        TOKEN_PROGRAM_ID
      )
      const bForPDA = await getAccount(
        connection,
        pdaUSDTAccount,
        null,
        TOKEN_PROGRAM_ID
      )
      // const maxTokenA = Math.floor(
      //   (Number(usdcForPDAAccount.amount) * amount) / Number(poolMint.supply)
      // )
      // const maxTokenB = Math.floor(
      //   (Number(usdtForPDAAccount.amount) * amount) / Number(poolMint.supply)
      // )

      await program.methods
        .depositAll(new anchor.BN(amount), new anchor.BN(10), new anchor.BN(10))
        .accounts({
          depositor: user.publicKey,
          pair: pool.publicKey,
          pda: poolPDA,
          tokenAForPda: pdaUSDCAccount,
          tokenBForPda: pdaUSDTAccount,
          tokenAForDepositor: aForUser,
          tokenBForDepositor: bForUser,
          tokenPoolForDepositor: poolForUser,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc()
      await sleep()
    }

    const printTable = async () => {
      console.table([
        {
          name: "Alice USDC",
          address: aliceUSDCAccount.toBase58(),
          owner: usdcForAliceAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDCAccount),
        },
        {
          name: "Alice USDT",
          address: aliceUSDTAccount.toBase58(),
          owner: usdtForAliceAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDTAccount),
        },
        {
          name: "Bob USDC",
          address: bobUSDCAccount.toBase58(),
          owner: usdcForBobAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, bobUSDCAccount),
        },
        {
          name: "Bob USDT",
          address: bobUSDTAccount.toBase58(),
          owner: usdtForBobAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, bobUSDTAccount),
        },
        {
          name: "PDA USDC",
          address: pdaUSDCAccount.toBase58(),
          owner: usdcForPDAAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, pdaUSDCAccount),
        },
        {
          name: "PDA USDT",
          address: pdaUSDTAccount.toBase58(),
          owner: usdtForPDAAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, pdaUSDTAccount),
        },
        {
          name: "System Fee Account",
          address: systemFeeAccount.toBase58(),
          owner: systemFeeForAdminAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, systemFeeAccount),
        },
      ])
    }

    await printTable()

    // await depositAll(
    //   "UserA",
    //   POOL_TOKEN_AMOUNT,
    //   alice,
    //   poolAccountForUserA,
    //   aliceUSDCAccount,
    //   aliceUSDTAccount
    // )

    const [loanPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("loan"), pool.publicKey.toBuffer()],
      program.programId
    )

    const loan = web3.Keypair.generate()
    await program.methods
      .initLoan(new BN(100 * DECIMALS))
      .accounts({
        loan: loan.publicKey,
        pool: pool.publicKey,
        poolPda: poolPDA,
        borrower: bob.publicKey,
        loanPda: loanPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenAForPda: pdaUSDCAccount,
        tokenBForPda: pdaUSDTAccount,
        tokenAForDepositor: bobUSDCAccount,
        tokenBForDepositor: bobUSDTAccount,
        systemFeeAccount: systemFeeAccount,
      })
      .preInstructions([await program.account.loan.createInstruction(loan)])
      .signers([loan, bob])
      .rpc()

    await printTable()

    const loanAccount = await program.account.loan.fetch(loan.publicKey)
    console.log(loanAccount)
  })
})

const sleep = () => new Promise((resolve) => setTimeout(resolve, 500))
