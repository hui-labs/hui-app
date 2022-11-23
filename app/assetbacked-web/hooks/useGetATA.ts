import { Workspace } from "@/hooks/useWorkspace"
import { PublicKey } from "@solana/web3.js"
import { useAsync } from "react-use"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  Mint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { AsyncState } from "react-use/lib/useAsyncFn"

export const useGetATA = (
  workspace: AsyncState<Workspace | null>,
  address: AsyncState<Mint | null>,
  owner?: PublicKey
) => {
  return useAsync(async () => {
    if (workspace.value && address.value) {
      return getAssociatedTokenAddress(
        address.value.address,
        owner ? owner : workspace.value.wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    }

    return null
  }, [workspace.value, address, owner])
}
