import { AsyncState } from "react-use/lib/useAsyncFn"
import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { PublicKey } from "@solana/web3.js"
import { useAsync } from "react-use"
import { getAccount, Mint } from "@solana/spl-token"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"

export const useAccount = (
  workspace: AsyncState<Workspace | null>,
  address: AsyncState<Mint | null>,
  owner?: PublicKey,
  shouldRefresh = false
) => {
  const associatedAccount = useAssociatedAccount(workspace, address, owner)
  return useAsync(async () => {
    if (workspace.value && associatedAccount.value) {
      return getAccount(
        workspace.value.connection,
        associatedAccount.value,
        commitmentLevel
      )
    }

    return null
  }, [workspace.value, associatedAccount.value, owner, shouldRefresh])
}
