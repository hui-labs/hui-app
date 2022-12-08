import { Connection } from "@solana/web3.js"
import { getKeypair } from "./get-private-key"
import { getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token"

const connection = new Connection(
  "https://solana-devnet.g.alchemy.com/v2/DUPxh6-6BQsfz8p5EIT0pghxVoMsCs4l"
)

async function allAccounts() {
  const keypair = await getKeypair()
  const res = await connection.getTokenAccountsByOwner(keypair.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  })

  for await (const value of res.value) {
    const account = await getAccount(connection, value.pubkey)
    console.log("account", account.mint.toBase58())

    // await burn(
    //   connection,
    //   keypair,
    //   value.pubkey,
    //   account.mint,
    //   value.pubkey,
    //   account.amount
    // )
    // const tx = await closeAccount(
    //   connection,
    //   keypair,
    //   value.pubkey,
    //   keypair.publicKey,
    //   keypair.publicKey
    // )
    // console.log(tx)
  }
}

allAccounts().catch(console.log)
