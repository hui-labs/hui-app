import idl from "@/contracts/idl/hui.json"
import { Connection } from "@solana/web3.js"
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react"
import { AnchorProvider, Program } from "@project-serum/anchor"
import { Hui } from "@/contracts/types/hui"
import { useEffect, useState } from "react"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { programId } from "@/common/constants"
import { AnchorClient } from "@/services/anchorClient"

const idlInterface = JSON.parse(JSON.stringify(idl))

export interface Workspace {
  wallet: AnchorWallet
  connection: Connection
  provider: AnchorProvider
  program: Program<Hui>
  client: AnchorClient
}

export const commitmentLevel = "processed"

export const useWorkspace = (): AsyncState<Workspace | null> => {
  const wallet = useAnchorWallet()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    if (wallet) {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL!,
        commitmentLevel
      )
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: commitmentLevel,
      })
      const program = new Program<Hui>(idlInterface, programId, provider)
      const client = new AnchorClient(program)

      setWorkspace({
        client,
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
