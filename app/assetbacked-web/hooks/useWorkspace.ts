import idl from "@/contracts/idl/hello_anchor.json"
import { Connection, PublicKey } from "@solana/web3.js"
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react"
import { AnchorProvider, Program } from "@project-serum/anchor"
import { HelloAnchor } from "@/contracts/types/hello_anchor"
import { useEffect, useState } from "react"
import { AsyncState } from "react-use/lib/useAsyncFn"
import * as anchor from "@project-serum/anchor"

const idlInterface = JSON.parse(JSON.stringify(idl))
const programId = new PublicKey("7ncy1ZWKme22jhAusPq1Ltk5AZuFJrJMqHFy2KPeosHz")

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
      const connection = new Connection(
        process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!,
        commitmentLevel
      )
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
