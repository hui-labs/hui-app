import idl from "@/contracts/idl/hui.json"
import { Connection, PublicKey } from "@solana/web3.js"
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react"
import { AnchorProvider, Program } from "@project-serum/anchor"
import { Hui } from "@/contracts/types/hui"
import { useEffect, useState } from "react"
import { AsyncState } from "react-use/lib/useAsyncFn"

const idlInterface = JSON.parse(JSON.stringify(idl))
export const programId = new PublicKey(
  "7syDmCTM9ap9zhfH1gwjDJcGD6LyGFGcggh4fsKxzovV"
)

export interface Workspace {
  wallet: AnchorWallet
  connection: Connection
  provider: AnchorProvider
  program: Program<Hui>
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
      const program = new Program<Hui>(idlInterface, programId, provider)

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
