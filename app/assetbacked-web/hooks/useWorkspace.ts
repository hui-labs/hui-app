import idl from "@/contracts/idl/hello_anchor.json"
import { Connection, PublicKey } from "@solana/web3.js"
import {
  AnchorWallet,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react"
import { AnchorProvider, Program } from "@project-serum/anchor"
import { HelloAnchor } from "@/contracts/types/hello_anchor"
import { useEffect, useState } from "react"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { Provider } from "@project-serum/anchor"

const idlInterface = JSON.parse(JSON.stringify(idl))
const network =
  "https://solana-devnet.g.alchemy.com/v2/DUPxh6-6BQsfz8p5EIT0pghxVoMsCs4l"
const programId = new PublicKey(idl.metadata.address)

export interface Workspace {
  wallet: AnchorWallet
  connection: Connection
  provider: AnchorProvider
  program: Program<HelloAnchor>
}
export const commitmentLevel = "processed"

export const useWorkspace = (): AsyncState<Workspace | null> => {
  const wallet = useAnchorWallet()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    if (wallet) {
      const connection = new Connection(network, commitmentLevel)
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: commitmentLevel,
      })
      const program = new Program<HelloAnchor>(
        idlInterface,
        programId,
        provider
      )

      setWorkspace({
        wallet,
        connection,
        provider,
        program,
      })
    }
  }, [wallet])

  return {
    value: workspace,
    error: undefined,
    loading: false,
  }
}
