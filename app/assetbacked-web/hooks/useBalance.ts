import { useProvider } from "./useProvider"
import { useAccount } from "./useAccount"
import { useAsync } from "react-use"

export const useBalance = () => {
  const provider = useProvider()
  const { publicKey } = useAccount()

  const state = useAsync(async () => {
    if (publicKey) {
      return provider?.connection.getBalance(publicKey)
    }

    return 0
  }, [provider, publicKey])

  return {
    error: state.error,
    balance: state.value,
    loading: state.loading,
  }
}
