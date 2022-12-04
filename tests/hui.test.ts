import * as anchor from "@project-serum/anchor"
import { BN, Program, web3 } from "@project-serum/anchor"
import { Hui } from "../target/types/hui"
import {
  createAccount,
  createAssociatedTokenAccountInstruction,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"

describe("test hui flow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.Hui as Program<Hui>
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
      [
        Buffer.from("pool"),
        alice.publicKey.toBuffer(),
        usdcMintPubkey.toBuffer(),
        usdtMintPubkey.toBuffer(),
      ],
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
    const DECIMALS = 10 ** 9

    // Mint tokens for Alice account
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
    const topUpAmount = new BN(100 * DECIMALS)
    const loanFee = topUpAmount.div(new BN(DECIMALS)).mul(new BN(1_000_000))

    const poolKeypair = Keypair.generate()
    const poolVaultKeypair = web3.Keypair.generate()
    const tx = await program.methods
      .initPool(
        {
          interestRate: new BN(10 * 10 ** 4), // 0.001
          maxLoanAmount: new BN(100 * DECIMALS),
          maxLoanThreshold: new BN(80 * 10 ** 4),
          minLoanAmount: new BN(10 * DECIMALS),
        },
        topUpAmount,
        loanFee,
        {
          oneMonth: {},
        }
      )
      .accounts({
        pool: poolKeypair.publicKey,
        poolPda: poolPDA,
        vaultAccount: poolVaultKeypair.publicKey,
        vaultMint: usdtMintPubkey,
        collateralMint: usdcMintPubkey,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        depositor: alice.publicKey,
        systemFeeAccount: systemUSDTFeeAccount,
        tokenDepositor: aliceUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([
        await program.account.pool.createInstruction(poolKeypair),
      ])
      .signers([alice, poolKeypair, poolVaultKeypair])
      .rpc()

    console.log("Your transaction signature:", tx)

    // Tom
    // Create loan PDA
    const [masterLoanPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("masterLoan"), poolKeypair.publicKey.toBuffer()],
      program.programId
    )
    const masterLoanKeypair = Keypair.generate()

    // Create loan vault USDC
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

    const nftMintKeypair = Keypair.generate()
    const nftAccountKeypair = Keypair.generate()
    const collateralKeypair = Keypair.generate()
    const vaultKeypair = Keypair.generate()

    const poolVaultAccount = await getAccount(
      connection,
      poolVaultKeypair.publicKey
    )

    const printTable = async (message: string) => {
      if (message) {
        console.log(message)
      }

      console.table([
        {
          name: "Tom USDT",
          address: tomUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, tomUSDTAccount),
        },
        {
          name: "Alice USDC",
          address: aliceUSDCAccount.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDCAccount),
        },
        {
          name: "Alice USDT",
          address: aliceUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDTAccount),
        },
        {
          name: "Bob USDC",
          address: bobUSDCAccount.toBase58(),
          amount: await getTokenBalance(connection, bobUSDCAccount),
        },
        {
          name: "Bob USDT",
          address: bobUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, bobUSDTAccount),
        },
        {
          name: "Pool Vault USDT",
          address: poolVaultAccount.address.toBase58(),
          amount: await getTokenBalance(connection, poolVaultAccount.address),
        },
      ])
    }
    await printTable("Created pool")

    await program.methods
      .initLoan(new BN(100 * DECIMALS))
      .accounts({
        nftMint: nftMintKeypair.publicKey,
        nftAccount: nftAccountKeypair.publicKey,
        masterLoan: masterLoanKeypair.publicKey,
        pool: poolKeypair.publicKey,
        poolPda: poolPDA,
        loanPda: masterLoanPDA,
        systemFeeAccount: systemUSDTFeeAccount,

        tokenDepositor: bobUSDCAccount,
        tokenReceiver: bobUSDTAccount,

        borrower: bob.publicKey,
        poolVault: poolVaultKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,

        collateralMint: usdcMintPubkey,
        collateralAccount: collateralKeypair.publicKey,
        vaultMint: usdtMintPubkey,
        vaultAccount: vaultKeypair.publicKey,
      })
      .preInstructions([
        await program.account.masterLoan.createInstruction(masterLoanKeypair),
      ])
      .signers([
        masterLoanKeypair,
        bob,
        collateralKeypair,
        vaultKeypair,
        nftMintKeypair,
        nftAccountKeypair,
      ])
      .rpc()

    const collateralAccount = await getAccount(
      connection,
      collateralKeypair.publicKey
    )
    const vaultAccount = await getAccount(connection, vaultKeypair.publicKey)
    const printTableAll = async (message?: string) => {
      if (message) {
        console.log(message)
      }

      console.table([
        {
          name: "Tom USDT",
          address: tomUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, tomUSDTAccount),
        },
        {
          name: "Alice USDC",
          address: aliceUSDCAccount.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDCAccount),
        },
        {
          name: "Alice USDT",
          address: aliceUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, aliceUSDTAccount),
        },
        {
          name: "Bob USDC",
          address: bobUSDCAccount.toBase58(),
          amount: await getTokenBalance(connection, bobUSDCAccount),
        },
        {
          name: "Bob USDT",
          address: bobUSDTAccount.toBase58(),
          amount: await getTokenBalance(connection, bobUSDTAccount),
        },
        {
          name: "Pool Vault USDT",
          address: poolVaultAccount.address.toBase58(),
          amount: await getTokenBalance(connection, poolVaultAccount.address),
        },
        {
          name: "Loan Collateral USDC",
          address: collateralAccount.address.toBase58(),
          amount: await getTokenBalance(connection, collateralAccount.address),
        },
        {
          name: "Loan Vault USDT",
          address: vaultAccount.address.toBase58(),
          amount: await getTokenBalance(connection, vaultAccount.address),
        },
        {
          name: "System Fee Account",
          address: systemUSDTFeeAccount.toBase58(),
          amount: await getTokenBalance(connection, systemUSDTFeeAccount),
        },
      ])
    }
    await printTableAll("Created loan")

    // Deposit USDC to the pool
    const depositTopUpAmount = new anchor.BN(10 * DECIMALS)
    const depositLoanFee = depositTopUpAmount
      .div(new BN(DECIMALS))
      .mul(new BN(1_000_000))
    await program.methods
      .deposit(depositTopUpAmount, depositLoanFee)
      .accounts({
        depositor: alice.publicKey,
        pool: poolKeypair.publicKey,
        loanVault: poolVaultAccount.address,
        tokenDepositor: aliceUSDTAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc()
    await sleep()
    await printTableAll("Deposit successfully")

    // Withdraw USDC to the pool
    await program.methods
      .withdraw(new anchor.BN(30 * DECIMALS))
      .accounts({
        depositor: alice.publicKey,
        pool: poolKeypair.publicKey,
        poolPda: poolPDA,
        tokenDepositor: aliceUSDTAccount,
        poolVault: poolVaultAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc()
    await sleep()
    await printTableAll("Withdraw successfully")

    await mintTo(
      connection,
      admin,
      usdtMint.address,
      bobUSDTAccount,
      usdtMint.mintAuthority,
      10 * DECIMALS
    )
    await sleep()
    await printTableAll("Mint USDT to bob")

    const [loanMetadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("loan"),
        masterLoanKeypair.publicKey.toBuffer(),
        nftAccountKeypair.publicKey.toBuffer(),
        nftMintKeypair.publicKey.toBuffer(),
      ],
      SystemProgram.programId
    )
    // Claims
    // const aliceNftTokenAccount = await createAccount(
    //   connection,
    //   alice,
    //   nftMintKeypair.publicKey,
    //   alice.publicKey,
    //   undefined,
    //   undefined,
    //   TOKEN_PROGRAM_ID
    // )

    const account = await getAssociatedTokenAddress(
      nftMintKeypair.publicKey,
      alice.publicKey
    )
    console.log("account", account.toBase58())

    const loanMetadataKeypair = Keypair.generate()
    await program.methods
      .claimNft()
      .accounts({
        masterLoan: masterLoanKeypair.publicKey,
        masterLoanPda: masterLoanPDA,
        nftMint: nftMintKeypair.publicKey,
        nftAccount: nftAccountKeypair.publicKey,
        claimAccount: account,
        owner: alice.publicKey,
        loanMetadata: loanMetadataKeypair.publicKey,
        loanMetadataPda: loanMetadataPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([alice, loanMetadataKeypair])
      .preInstructions([
        await program.account.loanMetadata.createInstruction(
          loanMetadataKeypair
        ),
        await createAssociatedTokenAccountInstruction(
          alice.publicKey,
          account,
          alice.publicKey,
          nftMintKeypair.publicKey
        ),
      ])
      .rpc()

    await sleep()
    const masterLoan = await program.account.masterLoan.fetch(
      masterLoanKeypair.publicKey
    )
    console.log("isClaimed", masterLoan.isClaimed)

    await program.methods
      .finalSettlement(new BN((80 + 5.99999976) * DECIMALS))
      .accounts({
        masterLoan: masterLoanKeypair.publicKey,
        masterLoanPda: masterLoanPDA,
        tokenDepositor: bobUSDTAccount,
        tokenReceiver: bobUSDCAccount,
        depositor: bob.publicKey,
        collateralAccount: collateralAccount.address,
        vaultAccount: vaultAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        loanMetadata: loanMetadataKeypair.publicKey,
      })
      .signers([bob])
      .rpc()
    await printTableAll("Final settlement")

    const tryGetAccountBalance = async (account: PublicKey) => {
      try {
        return (
          await connection.getTokenAccountBalance(account)
        ).value.amount.toString()
      } catch (e) {
        console.log(`Account ${account.toBase58()} closed`)
        return 0
      }
    }

    console.table([
      {
        name: "Alice",
        nft: await tryGetAccountBalance(account),
      },
    ])
    // Transfer NFT
    // await transfer(
    //   connection,
    //   alice,
    //   aliceNftTokenAccount,
    //   tomNftTokenAccount,
    //   alice,
    //   1
    // )
    // await printNft()

    // List NFT
    const itemAccountKeypair = Keypair.generate()
    const itemForSaleKeypair = Keypair.generate()
    const itemForSaleUSDTKeypair = Keypair.generate()
    const [itemForSalePDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("itemForSale"),
        alice.publicKey.toBuffer(),
        nftMintKeypair.publicKey.toBuffer(),
        itemAccountKeypair.publicKey.toBuffer(),
      ],
      program.programId
    )
    await program.methods
      .listNft(new BN(50 * DECIMALS))
      .accounts({
        seller: alice.publicKey,
        loanMetadata: loanMetadataKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        nftAccount: account,
        nftMint: nftMintKeypair.publicKey,
        itemAccount: itemAccountKeypair.publicKey,
        itemForSale: itemForSaleKeypair.publicKey,
        itemForSalePda: itemForSalePDA,
        vaultMint: usdtMintPubkey,
        vaultAccount: itemForSaleUSDTKeypair.publicKey,
      })
      .preInstructions([
        await program.account.itemForSale.createInstruction(itemForSaleKeypair),
      ])
      .signers([
        alice,
        itemAccountKeypair,
        itemForSaleKeypair,
        itemForSaleUSDTKeypair,
      ])
      .rpc()
    console.log("Listed NFT")

    // Cancel sale
    // await program.methods
    //   .delistNft()
    //   .accounts({
    //     nftMint: nftMintKeypair.publicKey,
    //     loanMetadata: loanMetadataKeypair.publicKey,
    //     nftAccount: account,
    //     rent: web3.SYSVAR_RENT_PUBKEY,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     itemForSalePda: itemForSalePDA,
    //     itemForSale: itemForSaleKeypair.publicKey,
    //     itemAccount: itemAccountKeypair.publicKey,
    //     owner: alice.publicKey,
    //   })
    //   .signers([alice])
    //   .rpc()
    // console.log("Delisted NFT")

    // Buy NFT

    await mintTo(
      connection,
      admin,
      usdtMint.address,
      tomUSDTAccount,
      usdtMint.mintAuthority,
      100 * DECIMALS
    )

    const tomAccount = await getAssociatedTokenAddress(
      nftMintKeypair.publicKey,
      tom.publicKey
    )
    // const buyerAccountKeypair = Keypair.generate()
    await program.methods
      .buyNft()
      .accounts({
        nftMint: nftMintKeypair.publicKey,
        itemForSale: itemForSaleKeypair.publicKey,
        itemForSalePda: itemForSalePDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        itemAccount: itemAccountKeypair.publicKey,
        loanMetadata: loanMetadataKeypair.publicKey,
        buyer: tom.publicKey,
        buyerAccount: tomAccount,
        vaultMint: usdtMintPubkey,
        vaultAccount: itemForSaleUSDTKeypair.publicKey,
        buyerTokenAccount: tomUSDTAccount,
      })
      .signers([tom])
      .preInstructions([
        await createAssociatedTokenAccountInstruction(
          tom.publicKey,
          tomAccount,
          tom.publicKey,
          nftMintKeypair.publicKey
        ),
      ])
      .rpc()
    console.log("Bought NFT")
    // console.table([
    //   {
    //     name: "Tom",
    //     nft: await tryGetAccountBalance(buyerAccountKeypair.publicKey),
    //   },
    // ])

    // Claim loan
    // await program.methods
    //   .claimLoan()
    //   .accounts({
    //     masterLoan: masterLoanKeypair.publicKey,
    //     masterLoanPda: masterLoanPDA,
    //     owner: tom.publicKey,
    //     nftAccount: tomNftTokenAccount,
    //     nftMint: nftMintKeypair.publicKey,
    //     vaultAccount: vaultAccount.address,
    //     tokenAccount: tomUSDTAccount,
    //     loanMetadata: loanMetadataKeypair.publicKey,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .signers([tom])
    //   .rpc()
    // await sleep()
    // await printTableAll("Claim rewards and close token account")
    // await printNft()

    // await closeAccount(
    //   connection,
    //   alice,
    //   aliceNftTokenAccount,
    //   alice.publicKey,
    //   alice
    // )
    //
    // await program.methods
    //   .closePool()
    //   .accounts({
    //     pool: masterLoan.publicKey,
    //     owner: alice.publicKey,
    //   })
    //   .rpc()
    // console.log("Closed pool account")
    // const a1 = Keypair.generate()
    // const a2 = Keypair.generate()
    // await program.methods
    //   .splitLoan(new BN(2))
    //   .accounts({
    //     loanMetadata: loanMetadataKeypair.publicKey,
    //   })
    //   .preInstructions([
    //     await program.account.loanMetadata.createInstruction(a1),
    //     await program.account.loanMetadata.createInstruction(a2),
    //   ])
    //   .remainingAccounts([
    //     {
    //       pubkey: a1.publicKey,
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //     {
    //       pubkey: a2.publicKey,
    //       isWritable: true,
    //       isSigner: false,
    //     },
    //   ])
    //   .signers([a1, a2])
    //   .rpc()
  })
})

const sleep = () => new Promise((resolve) => setTimeout(resolve, 500))
