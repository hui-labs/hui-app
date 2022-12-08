import { getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { PublicKey } from "@solana/web3.js"
import { useAsync } from "react-use"
import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { AsyncState } from "react-use/lib/useAsyncFn"

export const useGetMint = (
  workspace: AsyncState<Workspace | null>,
  mintAddress: PublicKey,
  reload?: boolean
) => {
  return useAsync(async () => {
    if (workspace.value) {
      return getMint(
        workspace.value.connection,
        mintAddress,
        commitmentLevel,
        TOKEN_PROGRAM_ID
      )
    }

    return null
  }, [workspace.value, mintAddress, reload])
}
