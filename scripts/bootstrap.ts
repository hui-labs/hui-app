import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { Hui } from "../app/hui-web/contracts/types/hui"
import { exec } from "child_process"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"
import { createAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"

anchor.setProvider(
  anchor.AnchorProvider.local(
    "https://solana-devnet.g.alchemy.com/v2/DUPxh6-6BQsfz8p5EIT0pghxVoMsCs4l"
  )
)
const program = anchor.workspace.Hui as Program<Hui>
const connection = program.provider.connection

const getProgramId = () => {
  return new Promise((resolve, reject) => {
    exec("anchor keys list", (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }
      if (stderr) {
        return reject(error)
      }

      resolve(stdout.replace("hui: ", ""))
    })
  })
}

async function main() {
  const programId = await getProgramId()
  const wallet = NodeWallet.local()
  const admin = wallet.payer
  // Create USDC and USDT token
  // const usdcMintPubkey = await createMint(
  //   connection,
  //   admin,
  //   admin.publicKey,
  //   null,
  //   9,
  //   undefined,
  //   undefined,
  //   TOKEN_PROGRAM_ID
  // )
  // const usdtMintPubkey = await createMint(
  //   connection,
  //   admin,
  //   admin.publicKey,
  //   null,
  //   9,
  //   undefined,
  //   undefined,
  //   TOKEN_PROGRAM_ID
  // )
  // const wethMintPubkey = await createMint(
  //   connection,
  //   admin,
  //   admin.publicKey,
  //   null,
  //   9,
  //   undefined,
  //   undefined,
  //   TOKEN_PROGRAM_ID
  // )
  // const wbtcMintPubkey = await createMint(
  //   connection,
  //   admin,
  //   admin.publicKey,
  //   null,
  //   9,
  //   undefined,
  //   undefined,
  //   TOKEN_PROGRAM_ID
  // )
  // console.log("USDC Mint", usdcMintPubkey.toBase58())
  // console.log("USDT Mint", usdtMintPubkey.toBase58())
  // console.log("WETH Mint", wethMintPubkey.toBase58())

  const systemUSDTFeeAccount = await createAccount(
    connection,
    admin,
    new PublicKey("JB7priytaWzyfradidEUJ7WnzUAE5giWzbFbGNxq7ns6"),
    admin.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )
  const systemUSDCFeeAccount = await createAccount(
    connection,
    admin,
    new PublicKey("7e3gKwJYYCkW6UqGXBmDA8csZkKmLe4V8NVqJP6YmnjF"),
    admin.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )
  console.log("System USDC Fee Account", systemUSDCFeeAccount.toBase58())
  console.log("System USDT Fee Account", systemUSDTFeeAccount.toBase58())

  // const privateKey = await getPrivateKey()

  //   const env = `NEXT_FAUCET_PRIVATE_KEY=${privateKey}
  // NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8899
  // NEXT_PUBLIC_PROGRAM_ID=${programId}
  // NEXT_PUBLIC_USDC_MINT_PUBKEY=${usdcMintPubkey.toBase58()}
  // NEXT_PUBLIC_USDT_MINT_PUBKEY=${usdtMintPubkey.toBase58()}
  // NEXT_PUBLIC_WETH_MINT_PUBKEY=${wethMintPubkey.toBase58()}
  // NEXT_PUBLIC_WBTC_MINT_PUBKEY=${wbtcMintPubkey.toBase58()}
  // NEXT_PUBLIC_SYSTEM_USDC_FEE_PUBKEY=${systemUSDCFeeAccount.toBase58()}
  // NEXT_PUBLIC_SYSTEM_USDT_FEE_PUBKEY=${systemUSDTFeeAccount.toBase58()}`

  // fs.writeFileSync("./app/hui-web/.env.local", env)
}

main().catch(console.log)
