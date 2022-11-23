import { AsyncState } from "react-use/lib/useAsyncFn"
import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { PublicKey } from "@solana/web3.js"
import { useAsync } from "react-use"
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"

export const useGetAccount = (
  workspace: AsyncState<Workspace | null>,
  associatedToken: AsyncState<PublicKey | null>
) => {
  return useAsync(async () => {
    if (workspace.value && associatedToken.value) {
      return getAccount(
        workspace.value.connection,
        associatedToken.value,
        commitmentLevel
      )
    }

    return null
  }, [workspace.value, associatedToken.value])
}
