// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import base58 from "bs58"
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js"
import { web3 } from "@project-serum/anchor"
import { commitmentLevel } from "@/hooks/useWorkspace"
import {
  createMintToInstruction,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"

type Data = {
  hash: string
}

const keypair = Keypair.fromSecretKey(
  base58.decode(process.env.NEXT_FAUCET_PRIVATE_KEY!)
)
const connection = new Connection(
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!,
  commitmentLevel
)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = req.body
  const transaction = new Transaction().add(
    createMintToInstruction(
      new PublicKey(body.mint),
      new PublicKey(body.destination),
      keypair.publicKey,
      100 * 10 ** 9,
      undefined,
      TOKEN_PROGRAM_ID
    )
  )
  const tx = await web3.sendAndConfirmTransaction(connection, transaction, [
    keypair,
  ])

  return res.status(200).json({
    hash: tx,
  })
}
