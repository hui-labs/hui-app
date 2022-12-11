import { useAsync } from "react-use"
import { commitmentLevel, Workspace } from "@/hooks/useWorkspace"
import { AsyncState } from "react-use/lib/useAsyncFn"
import { PublicKey } from "@solana/web3.js"

export const useBalance = (
  workspace: AsyncState<Workspace | null>,
  publicKey?: PublicKey,
  deps: any[] = []
) => {
  return useAsync(async () => {
    if (workspace.value) {
      return workspace.value.connection.getBalance(
        publicKey ? publicKey : workspace.value.wallet.publicKey,
        commitmentLevel
      )
    }
  }, [workspace.value, publicKey, ...deps])
}
