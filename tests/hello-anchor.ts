import * as anchor from "@project-serum/anchor"
import { BN, Program, web3 } from "@project-serum/anchor"
import { HelloAnchor } from "../target/types/hello_anchor"
import {
  approve,
  AuthorityType,
  burn,
  burnChecked,
  closeAccount,
  createAccount,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  MINT_SIZE,
  mintTo,
  setAuthority,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token"
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"

describe("hello-anchor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.HelloAnchor as Program<HelloAnchor>
  const connection = program.provider.connection

  it("Is initialized!", async () => {
    const alice = web3.Keypair.generate()
    const bob = web3.Keypair.generate()
    const tom = web3.Keypair.generate()
    const systemFee = web3.Keypair.generate()

    const wallet = NodeWallet.local()
    const admin = wallet.payer
    await connection.requestAirdrop(systemFee.publicKey, LAMPORTS_PER_SOL * 10)
    await connection.requestAirdrop(alice.publicKey, LAMPORTS_PER_SOL * 10)
    await connection.requestAirdrop(bob.publicKey, LAMPORTS_PER_SOL * 10)
    await connection.requestAirdrop(tom.publicKey, LAMPORTS_PER_SOL * 10)

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
      [Buffer.from("pool"), usdtMintPubkey.toBuffer()],
      program.programId
    )

    // Create system fee account
    const systemUSDTFeeAccount = await createAccount(
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

    // Tom

    const tomUSDTAccount = await createAccount(
      connection,
      tom,
      usdtMintPubkey,
      tom.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // Create token accounts for PDA
    const poolVaultUSDTAccount = await createAccount(
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
      poolVaultUSDTAccount,
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
    //   poolVaultUSDTAccount,
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
        mint: usdtMint.address,
      })
      .view()

    const pool = web3.Keypair.generate()
    const tx = await program.methods
      .initPool(
        {
          interestRate: new BN(10), // 0.001
          maxLoanAmount: new BN(100 * DECIMALS),
          maxLoanThreshold: new BN(0.8 * DECIMALS),
          minLoanAmount: new BN(10 * DECIMALS),
        },
        topUpAmount,
        requiredLoanFee
      )
      .accounts({
        pool: pool.publicKey,
        pda: poolPDA,
        vault: poolVaultUSDTAccount,
        depositor: alice.publicKey,
        systemFeeAccount: systemUSDTFeeAccount,
        tokenDepositor: aliceUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([await program.account.pool.createInstruction(pool)])
      .signers([alice, pool])
      .rpc()

    console.log("Your transaction signature:", tx)
    console.table([
      {
        name: "Pool",
        address: pool.publicKey.toBase58(),
        owner: (
          await connection.getAccountInfo(pool.publicKey)
        ).owner.toBase58(),
      },
    ])

    // Tom
    const usdtForTomAccount = await getAccount(
      connection,
      tomUSDTAccount,
      null,
      TOKEN_PROGRAM_ID
    )

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
    const usdtForPoolVaultAccount = await getAccount(
      connection,
      poolVaultUSDTAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    // Get system fee account
    const systemFeeForAdminAccount = await getAccount(
      connection,
      systemUSDTFeeAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    // Create loan PDA
    const [loanPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("loan"), pool.publicKey.toBuffer()],
      program.programId
    )
    const loan = web3.Keypair.generate()

    // Create loan vault USDC
    const loanUser = Keypair.generate()
    let airdropSignature = await connection.requestAirdrop(
      loanUser.publicKey,
      web3.LAMPORTS_PER_SOL
    )

    await connection.confirmTransaction(airdropSignature, "confirmed")
    const loanVaultUSDCAccount = await createAccount(
      connection,
      loanUser,
      usdcMintPubkey,
      loanUser.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const loanVaultUSDTAccount = await createAccount(
      connection,
      loanUser,
      usdtMintPubkey,
      loanUser.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    await setAuthority(
      connection,
      loanUser,
      loanVaultUSDCAccount,
      loanUser.publicKey,
      AuthorityType.AccountOwner,
      loanPDA,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    await setAuthority(
      connection,
      loanUser,
      loanVaultUSDTAccount,
      loanUser.publicKey,
      AuthorityType.AccountOwner,
      loanPDA,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const usdcForLoanVaultAccount = await getAccount(
      connection,
      loanVaultUSDCAccount,
      null,
      TOKEN_PROGRAM_ID
    )
    const usdtForLoanVaultAccount = await getAccount(
      connection,
      loanVaultUSDCAccount,
      null,
      TOKEN_PROGRAM_ID
    )

    const formatUnit = (amount: string, decimals: number = 9) =>
      parseInt(amount) / 10 ** decimals

    const getTokenBalance = async (
      connection: web3.Connection,
      pubkey: PublicKey,
      decimals = 9
    ) => {
      try {
        const { value } = await connection.getTokenAccountBalance(pubkey)
        if (decimals > 0) return formatUnit(value.amount)

        return value.amount
      } catch (e) {
        console.error(`Not a token account ${pubkey}`)
        return NaN
      }
    }

    const printTable = async () => {
      console.table([
        {
          name: "Tom USDT",
          address: tomUSDTAccount.toBase58(),
          owner: usdtForTomAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, tomUSDTAccount),
        },
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
          name: "Pool Vault USDT",
          address: poolVaultUSDTAccount.toBase58(),
          owner: usdtForPoolVaultAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, poolVaultUSDTAccount),
        },
        {
          name: "Loan Vault USDC",
          address: loanVaultUSDCAccount.toBase58(),
          owner: usdcForLoanVaultAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, loanVaultUSDCAccount),
        },
        {
          name: "Loan Vault USDT",
          address: loanVaultUSDTAccount.toBase58(),
          owner: usdtForLoanVaultAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, loanVaultUSDTAccount),
        },
        {
          name: "System Fee Account",
          address: systemUSDTFeeAccount.toBase58(),
          owner: systemFeeForAdminAccount.owner.toBase58(),
          amount: await getTokenBalance(connection, systemUSDTFeeAccount),
        },
      ])
    }
    await printTable()

    const mintNft = web3.Keypair.generate()
    await connection.requestAirdrop(mintNft.publicKey, LAMPORTS_PER_SOL * 10)
    const nftMintPubkey = await createMint(
      connection,
      alice,
      loanPDA,
      null,
      0,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    const nftTokenAccount = await createAccount(
      connection,
      alice,
      nftMintPubkey,
      alice.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )

    // const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    //   "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    // )

    await program.methods
      .initLoan(new BN(100 * DECIMALS), {
        oneMonth: {},
      })
      .accounts({
        mintNft: nftMintPubkey,
        nftTokenAccount: nftTokenAccount,
        loan: loan.publicKey,
        pool: pool.publicKey,
        poolPda: poolPDA,
        borrower: bob.publicKey,
        loanPda: loanPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        systemFeeAccount: systemUSDTFeeAccount,
        tokenDepositor: bobUSDCAccount,
        tokenReceiver: bobUSDTAccount,
        poolVault: poolVaultUSDTAccount,
        loanAVault: loanVaultUSDCAccount,
        loanBVault: loanVaultUSDTAccount,
      })
      .preInstructions([await program.account.loan.createInstruction(loan)])
      .signers([loan, bob])
      .rpc()

    await printTable()

    // Deposit USDC to the pool
    const depositTopUpAmount = new anchor.BN(10 * DECIMALS)
    const requiredDepositLoanFee: BN = await program.methods
      .estimateLoanFee(depositTopUpAmount)
      .accounts({
        mint: usdtMint.address,
      })
      .view()
    await program.methods
      .deposit(depositTopUpAmount, requiredDepositLoanFee)
      .accounts({
        depositor: alice.publicKey,
        pool: pool.publicKey,
        loanVault: poolVaultUSDTAccount,
        tokenDepositor: aliceUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc()
    await sleep()
    await printTable()

    // Withdraw USDC to the pool
    await program.methods
      .withdraw(new anchor.BN(30 * DECIMALS))
      .accounts({
        depositor: alice.publicKey,
        pool: pool.publicKey,
        poolPda: poolPDA,
        tokenDepositor: aliceUSDTAccount,
        poolVault: poolVaultUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc()
    await sleep()
    await printTable()

    const interestRate = await program.methods
      .settlementAmount()
      .accounts({
        loan: loan.publicKey,
      })
      .view()
    console.log(formatUnit(interestRate))
    // const loanAccount = await program.account.loan.fetch(loan.publicKey)
    // console.log(loanAccount)

    await mintTo(
      connection,
      admin,
      usdtMint.address,
      bobUSDTAccount,
      usdtMint.mintAuthority,
      10 * DECIMALS
    )
    await sleep()
    await printTable()
    await program.methods
      .finalSettlement(new BN((80 + 5.99999976) * DECIMALS))
      .accounts({
        loan: loan.publicKey,
        loanPda: loanPDA,
        tokenDepositor: bobUSDTAccount,
        tokenReceiver: bobUSDCAccount,
        depositor: bob.publicKey,
        loanAVault: loanVaultUSDCAccount,
        loanBVault: loanVaultUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bob])
      .rpc()
    await printTable()

    // Claims
    // await approve(connection, alice, nftTokenAccount, loanPDA, alice, 1)
    // console.log(await connection.getTokenAccountBalance(nftTokenAccount))
    // await burnChecked(
    //   connection,
    //   alice,
    //   nftTokenAccount,
    //   nftMintPubkey,
    //   alice,
    //   1,
    //   0
    // )
    const tomNftTokenAccount = await createAccount(
      connection,
      tom,
      nftMintPubkey,
      tom.publicKey,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
    await transfer(
      connection,
      alice,
      nftTokenAccount,
      tomNftTokenAccount,
      alice,
      1
    )
    console.log(
      (await connection.getTokenAccountBalance(nftTokenAccount)).value
    )
    console.log(
      (await connection.getTokenAccountBalance(tomNftTokenAccount)).value
    )
    await program.methods
      .claimLoan()
      .accounts({
        loan: loan.publicKey,
        loanPda: loanPDA,
        owner: tom.publicKey,
        nftAccount: tomNftTokenAccount,
        mintNft: nftMintPubkey,
        nftDestination: tom.publicKey,
        loanVault: loanVaultUSDTAccount,
        tokenAccount: tomUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([tom])
      .rpc()
    await sleep()
    await printTable()
    console.log(
      (await connection.getTokenAccountBalance(nftTokenAccount)).value
    )
    await closeAccount(
      connection,
      alice,
      nftTokenAccount,
      alice.publicKey,
      alice
    )
  })
})

const sleep = () => new Promise((resolve) => setTimeout(resolve, 500))
