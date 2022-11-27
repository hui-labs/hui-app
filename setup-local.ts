import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"
import { createAccount, createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { Hui } from "./app/hui-web/contracts/types/hui"
import * as path from "path"
import * as fs from "fs"
import * as os from "os"

const envFilePath = path.resolve(__dirname, ".env")
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL)

const getEnvValue = (key) => {
  const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key)
  return matchedLine !== undefined ? matchedLine.split("=")[1] : null
}

const setEnvValue = (key, value) => {
  const envVars = readEnvVars()
  const targetLine = envVars.find((line) => line.split("=")[0] === key)
  if (targetLine !== undefined) {
    const targetLineIndex = envVars.indexOf(targetLine)
    envVars.splice(targetLineIndex, 1, `${key}="${value}"`)
  } else {
    envVars.push(`${key}="${value}"`)
  }
  fs.writeFileSync(envFilePath, envVars.join(os.EOL))
}

anchor.setProvider(anchor.AnchorProvider.env())
const program = anchor.workspace.Hui as Program<Hui>
const connection = program.provider.connection

async function main() {
  const wallet = NodeWallet.local()
  const admin = wallet.payer
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
  console.log("USDC Mint", usdcMintPubkey.toBase58())
  console.log("USDT Mint", usdtMintPubkey.toBase58())

  const systemUSDTFeeAccount = await createAccount(
    connection,
    admin,
    new PublicKey(usdtMintPubkey),
    admin.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )
  const systemUSDCFeeAccount = await createAccount(
    connection,
    admin,
    new PublicKey(usdcMintPubkey),
    admin.publicKey,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )
  console.log("System USDC Fee Account", systemUSDCFeeAccount.toBase58())
  console.log("System USDT Fee Account", systemUSDTFeeAccount.toBase58())
}

main().catch(console.log)
