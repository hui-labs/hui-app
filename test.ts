import { Program, web3 } from "@project-serum/anchor"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import * as anchor from "@project-serum/anchor"
import { HelloAnchor } from "./app/assetbacked-web/contracts/types/hello_anchor"

anchor.setProvider(anchor.AnchorProvider.env())
const program = anchor.workspace.HelloAnchor as Program<HelloAnchor>
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
  console.log(usdcMintPubkey.toBase58())
  console.log(usdtMintPubkey.toBase58())
}
// console.log(
//   web3.Keypair.fromSecretKey(
//     Uint8Array.from([
//       127, 154, 238, 81, 208, 124, 154, 182, 151, 191, 245, 148, 25, 168, 132,
//       77, 162, 6, 217, 206, 85, 2, 94, 216, 135, 64, 198, 178, 133, 198, 105,
//       103, 184, 81, 44, 239, 59, 228, 62, 48, 129, 81, 145, 58, 111, 125, 199,
//       233, 15, 28, 112, 227, 131, 81, 20, 201, 77, 71, 229, 169, 232, 29, 212,
//       203,
//     ])
//   ).secretKey
// )
